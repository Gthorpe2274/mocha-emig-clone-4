/**
 * Data retention cleanup service
 * Implements two-year retention policy for assessment data and related records
 */

export class RetentionCleanupService {
  private db: D1Database;
  private kv?: KVNamespace;

  constructor(db: D1Database, kv?: KVNamespace) {
    this.db = db;
    this.kv = kv;
  }

  /**
   * Clean up expired assessment data and related records
   * Called by scheduled cron job
   */
  async cleanupExpiredData(): Promise<{
    assessmentsDeleted: number;
    reportsDeleted: number;
    paymentsDeleted: number;
    jobsDeleted: number;
    kvsDeleted: number;
  }> {
    console.log('=== STARTING RETENTION CLEANUP ===');
    
    const results = {
      assessmentsDeleted: 0,
      reportsDeleted: 0,
      paymentsDeleted: 0,
      jobsDeleted: 0,
      kvsDeleted: 0
    };

    try {
      // Get expired assessments (older than 2 years)
      const expiredAssessments = await this.db.prepare(`
        SELECT id, created_at, retention_expires_at 
        FROM assessments 
        WHERE retention_expires_at <= datetime('now')
        ORDER BY created_at ASC
        LIMIT 100
      `).all();

      console.log(`Found ${expiredAssessments.results.length} expired assessments to clean up`);

      for (const assessment of expiredAssessments.results) {
        const assessmentId = Number(assessment.id);
        console.log(`Cleaning up assessment ${assessmentId} (expired: ${assessment.retention_expires_at})`);

        try {
          // Clean up related reports and PDF files
          const reports = await this.db.prepare(`
            SELECT id, pdf_url FROM reports WHERE assessment_id = ?
          `).bind(assessmentId).all();

          for (const report of reports.results) {
            // Delete PDF from KV storage if it exists
            if (this.kv && report.pdf_url) {
              try {
                await this.kv.delete(String(report.pdf_url));
                results.kvsDeleted++;
                console.log(`Deleted PDF from KV: ${report.pdf_url}`);
              } catch (kvError) {
                console.warn(`Failed to delete PDF from KV: ${report.pdf_url}`, kvError);
              }
            }
          }

          // Delete reports
          const reportDeleteResult = await this.db.prepare(`
            DELETE FROM reports WHERE assessment_id = ?
          `).bind(assessmentId).run();
          results.reportsDeleted += reportDeleteResult.meta?.changes || 0;

          // Delete payments
          const paymentDeleteResult = await this.db.prepare(`
            DELETE FROM payments WHERE assessment_id = ?
          `).bind(assessmentId).run();
          results.paymentsDeleted += paymentDeleteResult.meta?.changes || 0;

          // Delete report jobs
          const jobDeleteResult = await this.db.prepare(`
            DELETE FROM report_jobs WHERE assessment_id = ?
          `).bind(assessmentId).run();
          results.jobsDeleted += jobDeleteResult.meta?.changes || 0;

          // Finally, delete the assessment itself
          const assessmentDeleteResult = await this.db.prepare(`
            DELETE FROM assessments WHERE id = ?
          `).bind(assessmentId).run();
          results.assessmentsDeleted += assessmentDeleteResult.meta?.changes || 0;

          console.log(`Successfully cleaned up assessment ${assessmentId}`);

        } catch (cleanupError) {
          console.error(`Error cleaning up assessment ${assessmentId}:`, cleanupError);
          // Continue with other assessments even if one fails
        }
      }

      // Clean up orphaned KV entries (job data older than 30 days)
      if (this.kv) {
        try {
          await this.cleanupOrphanedJobData();
        } catch (kvCleanupError) {
          console.warn('Failed to cleanup orphaned KV job data:', kvCleanupError);
        }
      }

      console.log('=== RETENTION CLEANUP COMPLETED ===');
      console.log('Cleanup results:', results);

      return results;

    } catch (error) {
      console.error('=== RETENTION CLEANUP ERROR ===');
      console.error('Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned job data from KV storage
   * Jobs older than 30 days that are no longer in the database
   */
  private async cleanupOrphanedJobData(): Promise<void> {
    if (!this.kv) return;

    console.log('Cleaning up orphaned job data from KV...');
    
    // Note: This is a simplified cleanup since KV doesn't support listing by prefix patterns easily
    // In a production environment, you might want to maintain a separate index of job keys
    // or use a different approach for job data storage with built-in expiration
    
    // For now, we rely on the TTL set when creating KV entries
    // Job entries are created with 7-day TTL, so they'll expire automatically
    console.log('KV job data cleanup relies on automatic TTL expiration (7 days)');
  }

  /**
   * Get statistics about data that will be cleaned up
   */
  async getCleanupStats(): Promise<{
    expiredAssessments: number;
    totalAssessments: number;
    oldestExpiredDate: string | null;
    nextCleanupDate: string | null;
  }> {
    const stats = await this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN retention_expires_at <= datetime('now') THEN 1 END) as expired_count,
        COUNT(*) as total_count,
        MIN(CASE WHEN retention_expires_at <= datetime('now') THEN retention_expires_at END) as oldest_expired,
        MIN(CASE WHEN retention_expires_at > datetime('now') THEN retention_expires_at END) as next_expiry
      FROM assessments
    `).first();

    return {
      expiredAssessments: Number(stats?.expired_count || 0),
      totalAssessments: Number(stats?.total_count || 0),
      oldestExpiredDate: stats?.oldest_expired ? String(stats.oldest_expired) : null,
      nextCleanupDate: stats?.next_expiry ? String(stats.next_expiry) : null
    };
  }

  /**
   * Check if an assessment is still within retention period
   */
  async isAssessmentRetained(assessmentId: number): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT retention_expires_at 
      FROM assessments 
      WHERE id = ? AND retention_expires_at > datetime('now')
    `).bind(assessmentId).first();

    return !!result;
  }

  /**
   * Extend retention period for a specific assessment (admin function)
   * This could be used if a user purchases an extended service
   */
  async extendRetention(assessmentId: number, additionalMonths: number = 12): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE assessments 
      SET retention_expires_at = datetime(retention_expires_at, '+${additionalMonths} months'),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(assessmentId).run();

    return (result.meta?.changes || 0) > 0;
  }
}

// Helper function for scheduled cleanup
export async function runScheduledCleanup(env: Env): Promise<Response> {
  console.log('=== SCHEDULED RETENTION CLEANUP STARTED ===');
  
  try {
    const retentionService = new RetentionCleanupService(env.DB, env.REPORTS_KV);
    const results = await retentionService.cleanupExpiredData();
    
    console.log('Scheduled cleanup completed successfully:', results);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Retention cleanup completed',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Scheduled cleanup failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Retention cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
