import { ReportGenerator } from '@/shared/report-generator';
import { PDFGenerator } from '@/shared/pdf-generator';

export interface ReportJob {
  id: string;
  assessmentId: number;
  paymentId: number;
  customerEmail?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
  // New fields for chunked processing
  currentStep?: number;
  totalSteps?: number;
  completedSections?: string[];
  progressData?: any;
}

export class JobQueue {
  private db: D1Database;
  private kv: KVNamespace;
  private openaiKey: string;
  private resendApiKey?: string;

  constructor(db: D1Database, kv: KVNamespace, openaiKey: string, resendApiKey?: string) {
    this.db = db;
    this.kv = kv;
    this.openaiKey = openaiKey;
    this.resendApiKey = resendApiKey;
  }

  async enqueueReportGeneration(assessmentId: number, paymentId: number, customerEmail?: string): Promise<string> {
    const jobId = `report-${Date.now()}-${crypto.randomUUID()}`;
    
    const job: ReportJob = {
      id: jobId,
      assessmentId,
      paymentId,
      customerEmail,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store job in KV for processing
    await this.kv.put(`job:${jobId}`, JSON.stringify(job), {
      expirationTtl: 7 * 24 * 60 * 60 // 7 days
    });

    // Also store in database for tracking
    await this.db.prepare(`
      INSERT INTO report_jobs (job_id, assessment_id, payment_id, customer_email, status, attempts, max_attempts)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      jobId,
      assessmentId,
      paymentId,
      customerEmail || null,
      'pending',
      0,
      3
    ).run();

    console.log(`Enqueued report generation job: ${jobId}`);
    return jobId;
  }

  async processJob(jobId: string): Promise<boolean> {
    console.log(`=== PROCESSING JOB ${jobId} ===`);
    
    // Get job from KV
    const jobData = await this.kv.get(`job:${jobId}`, 'json') as ReportJob;
    if (!jobData) {
      console.error(`Job ${jobId} not found in KV`);
      
      // Try to recreate from database
      const dbJob = await this.db.prepare(`
        SELECT * FROM report_jobs WHERE job_id = ?
      `).bind(jobId).first();
      
      if (dbJob) {
        console.log(`Recreating job ${jobId} in KV from database record`);
        const recreatedJob: ReportJob = {
          id: String(dbJob.job_id),
          assessmentId: Number(dbJob.assessment_id),
          paymentId: Number(dbJob.payment_id),
          customerEmail: dbJob.customer_email ? String(dbJob.customer_email) : undefined,
          status: String(dbJob.status) as 'pending' | 'processing' | 'completed' | 'failed',
          attempts: Number(dbJob.attempts),
          maxAttempts: Number(dbJob.max_attempts),
          createdAt: String(dbJob.created_at),
          updatedAt: new Date().toISOString()
        };
        
        await this.kv.put(`job:${jobId}`, JSON.stringify(recreatedJob), {
          expirationTtl: 7 * 24 * 60 * 60
        });
        
        return await this.processJob(jobId);
      }
      
      return false;
    }

    // Update status to processing
    jobData.status = 'processing';
    jobData.attempts += 1;
    jobData.updatedAt = new Date().toISOString();
    
    await this.kv.put(`job:${jobId}`, JSON.stringify(jobData));
    await this.updateJobStatus(jobId, 'processing', jobData.attempts);

    try {
      // Get assessment data
      const assessment = await this.db.prepare(
        "SELECT * FROM assessments WHERE id = ?"
      ).bind(jobData.assessmentId).first();

      if (!assessment) {
        throw new Error(`Assessment ${jobData.assessmentId} not found`);
      }

      console.log(`Generating report for assessment ${jobData.assessmentId} using chunked processing`);
      
      // Use chunked processing approach
      const success = await this.processReportInChunks(jobData, assessment as any);
      
      if (success) {
        console.log(`Job ${jobId} completed successfully`);
        return true;
      } else {
        // Job will continue in next processing cycle
        console.log(`Job ${jobId} partially completed, will continue in next cycle`);
        return false;
      }

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      
      jobData.status = 'failed';
      jobData.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      jobData.updatedAt = new Date().toISOString();

      await this.kv.put(`job:${jobId}`, JSON.stringify(jobData));
      await this.updateJobStatus(jobId, 'failed', jobData.attempts, jobData.errorMessage);

      // Retry if we haven't exceeded max attempts
      if (jobData.attempts < jobData.maxAttempts) {
        console.log(`Scheduling retry for job ${jobId} (attempt ${jobData.attempts}/${jobData.maxAttempts})`);
        // Reset status for retry
        jobData.status = 'pending';
        await this.kv.put(`job:${jobId}`, JSON.stringify(jobData));
        await this.updateJobStatus(jobId, 'pending', jobData.attempts);
        return false; // Will be retried
      }

      return false;
    }
  }

  // ULTRA-EFFICIENT PROCESSING: Uses only 1-2 API calls instead of 20+
  private async processReportInChunks(jobData: ReportJob, assessment: any): Promise<boolean> {
    const reportGenerator = new ReportGenerator(this.openaiKey);
    
    console.log('=== ULTRA-EFFICIENT PROCESSING: Minimizing OpenAI API calls ===');
    
    // Initialize progress tracking for the simplified approach
    if (!jobData.currentStep) {
      jobData.currentStep = 0;
      jobData.totalSteps = 2; // 1 for report generation, 1 for PDF creation
      jobData.completedSections = [];
      jobData.progressData = { reportGenerated: false, pdfGenerated: false };
    }

    console.log(`=== EFFICIENT PROCESSING: Step ${jobData.currentStep}/${jobData.totalSteps} ===`);

    // Stage 1: Generate complete report using ultra-efficient method (1-2 API calls max)
    if (!jobData.progressData.reportGenerated) {
      console.log('=== STAGE 1: GENERATING COMPLETE REPORT (1-2 API CALLS) ===');
      
      try {
        console.log('Using ultra-efficient report generation to minimize API usage...');
        
        // Use the new ultra-efficient method that makes only 1-2 API calls
        const report = await this.withTimeout(
          reportGenerator.generateUltraEfficientReport(assessment),
          300000 // 5 minutes max for complete report generation
        );
        
        // Store the generated report
        jobData.progressData.generatedReport = report;
        jobData.progressData.reportGenerated = true;
        jobData.currentStep = 1;
        
        console.log(`✅ Complete report generated successfully with ${report.sections.length} sections`);
        console.log(`Executive summary length: ${report.executiveSummary.length} characters`);
        
        // Save progress
        jobData.updatedAt = new Date().toISOString();
        await this.kv.put(`job:${jobData.id}`, JSON.stringify(jobData));
        
      } catch (reportError) {
        console.error('Failed to generate complete report:', reportError);
        const errorMessage = reportError instanceof Error ? reportError.message : 'Unknown error';
        
        // Check if it's a rate limit error and provide helpful message
        if (errorMessage.includes('Rate limit') || errorMessage.includes('rate limit')) {
          throw new Error('OpenAI rate limit reached. Please wait a few minutes and try again. This usually happens with free OpenAI accounts.');
        }
        
        throw new Error(`Complete report generation failed: ${errorMessage}`);
      }
    }

    // Stage 2: Generate PDF and finalize
    if (jobData.progressData.reportGenerated && !jobData.progressData.pdfGenerated) {
      console.log('=== STAGE 2: GENERATING PDF AND FINALIZING ===');
      
      try {
        const report = jobData.progressData.generatedReport;
        
        // Generate PDF
        console.log('Converting report to PDF...');
        const pdfGenerator = new PDFGenerator();
        const pdfBuffer = await this.withTimeout(
          pdfGenerator.generateReportPDF(report, jobData.assessmentId),
          60000 // 1 minute max for PDF
        );

        // Create download token and save report
        const downloadToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Store report in database
        const reportResult = await this.db.prepare(`
          INSERT INTO reports (assessment_id, payment_id, report_content, download_token, download_expires_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          jobData.assessmentId,
          jobData.paymentId,
          JSON.stringify(report),
          downloadToken,
          expiresAt.toISOString()
        ).run();

        const reportId = reportResult.meta.last_row_id;
        const pdfKey = `report-${reportId}`;

        // Store PDF in KV
        await this.kv.put(pdfKey, pdfBuffer, {
          expirationTtl: 7 * 24 * 60 * 60
        });

        // Update report with PDF URL
        await this.db.prepare(`
          UPDATE reports SET pdf_url = ? WHERE id = ?
        `).bind(pdfKey, reportId).run();

        // Mark job as completed
        jobData.status = 'completed';
        jobData.currentStep = 2;
        jobData.progressData.pdfGenerated = true;
        jobData.updatedAt = new Date().toISOString();
        await this.kv.put(`job:${jobData.id}`, JSON.stringify(jobData));
        await this.updateJobStatus(jobData.id, 'completed', jobData.attempts);

        // Send email if provided (skip for now due to domain verification issues)
        if (jobData.customerEmail && this.resendApiKey) {
          try {
            console.log(`📧 Email notification skipped for ${jobData.customerEmail} - using manual download instead`);
            console.log(`📋 Report ready for download at: /api/reports/download/${downloadToken}`);
            // TODO: Re-enable email once emigrationpro.com domain is verified in Resend
            /*
            const emailService = new EmailService(this.resendApiKey);
            const emailResult = await emailService.sendReportEmail(jobData.customerEmail, {
              country: String(assessment.preferred_country),
              city: assessment.preferred_city ? String(assessment.preferred_city) : undefined,
              downloadToken,
              customerName: String(assessment.user_job),
              expiresAt: expiresAt.toDateString(),
              assessmentId: jobData.assessmentId
            });
            
            if (emailResult.success) {
              console.log(`✅ Report email sent successfully to ${jobData.customerEmail}, Message ID: ${emailResult.messageId}`);
            } else {
              console.warn(`⚠️ Email sending failed: ${emailResult.error}`);
            }
            */
          } catch (emailError) {
            console.warn('Email sending error:', emailError);
            // Don't fail the job for email issues
          }
        }

        console.log('🎉 Ultra-efficient report generation completed successfully with minimal API calls!');
        return true;
        
      } catch (finalError) {
        console.error('Failed to generate PDF or finalize report:', finalError);
        throw finalError;
      }
    }

    // This should not happen in the new simplified flow
    console.warn('Unexpected state in ultra-efficient processing');
    return false;
  }

  async getJobStatus(jobId: string): Promise<ReportJob | null> {
    const jobData = await this.kv.get(`job:${jobId}`, 'json') as ReportJob;
    return jobData || null;
  }

  // Get detailed progress information for ultra-efficient processing
  async getJobProgress(jobId: string): Promise<{
    jobId: string;
    status: string;
    progress: {
      currentStep: number;
      totalSteps: number;
      percentage: number;
      completedSections: string[];
      currentPhase: string;
      stageBreakdown: {
        reportGeneration: boolean;
        pdfGeneration: boolean;
      };
    };
    attempts: number;
    maxAttempts: number;
    errorMessage?: string;
  } | null> {
    const jobData = await this.kv.get(`job:${jobId}`, 'json') as ReportJob;
    if (!jobData) return null;

    const currentStep = jobData.currentStep || 0;
    const totalSteps = jobData.totalSteps || 2; // Ultra-efficient: only 2 steps
    const completedSections = jobData.completedSections || [];
    
    // Calculate progress for ultra-efficient approach
    const reportGenerated = jobData.progressData?.reportGenerated || false;
    const pdfGenerated = jobData.progressData?.pdfGenerated || false;
    
    // Determine current phase for ultra-efficient processing
    let currentPhase = 'Initializing ultra-efficient report generation...';
    if (jobData.status === 'completed') {
      currentPhase = 'Complete - Report ready for download!';
    } else if (jobData.status === 'failed') {
      currentPhase = 'Failed';
    } else if (!reportGenerated) {
      currentPhase = 'Stage 1: Generating complete report with AI (1-2 API calls)...';
    } else if (reportGenerated && !pdfGenerated) {
      currentPhase = 'Stage 2: Converting to PDF and finalizing...';
    } else {
      currentPhase = 'Processing...';
    }

    return {
      jobId: jobData.id,
      status: jobData.status,
      progress: {
        currentStep,
        totalSteps,
        percentage: Math.round((currentStep / totalSteps) * 100),
        completedSections,
        currentPhase,
        stageBreakdown: {
          reportGeneration: reportGenerated,
          pdfGeneration: pdfGenerated
        }
      },
      attempts: jobData.attempts,
      maxAttempts: jobData.maxAttempts,
      errorMessage: jobData.errorMessage
    };
  }

  async processPendingJobs(): Promise<void> {
    console.log('Processing pending jobs...');
    
    // Get pending jobs from database
    const pendingJobs = await this.db.prepare(`
      SELECT job_id FROM report_jobs 
      WHERE status = 'pending' AND attempts < max_attempts
      ORDER BY created_at ASC
      LIMIT 5
    `).all();

    for (const job of pendingJobs.results) {
      try {
        await this.processJob(String(job.job_id));
      } catch (error) {
        console.error(`Error processing job ${job.job_id}:`, error);
      }
    }
  }

  // Utility method to restore missing KV jobs from database
  async restoreMissingKVJobs(): Promise<{ restored: number; errors: string[] }> {
    console.log('=== RESTORING MISSING KV JOBS FROM DATABASE ===');
    
    const results = { restored: 0, errors: [] as string[] };
    
    try {
      // Get all active jobs from database
      const activeJobs = await this.db.prepare(`
        SELECT * FROM report_jobs 
        WHERE status IN ('pending', 'processing') 
        ORDER BY created_at DESC
        LIMIT 20
      `).all();

      console.log(`Found ${activeJobs.results.length} active jobs in database`);

      for (const dbJob of activeJobs.results) {
        const jobId = String(dbJob.job_id);
        
        try {
          // Check if job exists in KV
          const kvJob = await this.kv.get(`job:${jobId}`, 'json');
          
          if (!kvJob) {
            console.log(`Restoring missing KV job: ${jobId}`);
            
            // Recreate job in KV from database record
            const recreatedJob: ReportJob = {
              id: String(dbJob.job_id),
              assessmentId: Number(dbJob.assessment_id),
              paymentId: Number(dbJob.payment_id),
              customerEmail: dbJob.customer_email ? String(dbJob.customer_email) : undefined,
              status: String(dbJob.status) as 'pending' | 'processing' | 'completed' | 'failed',
              attempts: Number(dbJob.attempts),
              maxAttempts: Number(dbJob.max_attempts),
              createdAt: String(dbJob.created_at),
              updatedAt: new Date().toISOString()
            };
            
            await this.kv.put(`job:${jobId}`, JSON.stringify(recreatedJob), {
              expirationTtl: 7 * 24 * 60 * 60
            });
            
            results.restored++;
            console.log(`✅ Restored job ${jobId} to KV`);
          }
        } catch (jobError) {
          const error = `Failed to restore job ${jobId}: ${jobError instanceof Error ? jobError.message : 'Unknown error'}`;
          console.error(error);
          results.errors.push(error);
        }
      }

      console.log(`=== KV RESTORATION COMPLETE: ${results.restored} jobs restored, ${results.errors.length} errors ===`);
      
    } catch (error) {
      const errorMsg = `Failed to restore KV jobs: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    return results;
  }

  private async updateJobStatus(jobId: string, status: string, attempts: number, errorMessage?: string): Promise<void> {
    await this.db.prepare(`
      UPDATE report_jobs 
      SET status = ?, attempts = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ?
    `).bind(status, attempts, errorMessage || null, jobId).run();
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  
}
