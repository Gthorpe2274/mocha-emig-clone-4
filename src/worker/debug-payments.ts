// Debug utility to check payment and report status
export async function debugPaymentStatus(db: D1Database) {
  console.log("=== PAYMENT DEBUG REPORT ===");
  
  // Get all payments
  const payments = await db.prepare(`
    SELECT p.*, a.preferred_country, a.preferred_city, a.user_job
    FROM payments p 
    LEFT JOIN assessments a ON p.assessment_id = a.id 
    ORDER BY p.created_at DESC
  `).all();
  
  console.log(`Total payments: ${payments.results.length}`);
  
  for (const payment of payments.results) {
    console.log(`\nPayment ID: ${payment.id}`);
    console.log(`  Assessment: ${payment.assessment_id} (${payment.preferred_country})`);
    console.log(`  Status: ${payment.status}`);
    console.log(`  Stripe PI: ${payment.stripe_payment_intent_id}`);
    console.log(`  Amount: $${(payment.amount as number) / 100}`);
    console.log(`  Created: ${payment.created_at}`);
  }
  
  // Get all reports
  const reports = await db.prepare(`
    SELECT r.*, a.preferred_country 
    FROM reports r 
    LEFT JOIN assessments a ON r.assessment_id = a.id 
    ORDER BY r.created_at DESC
  `).all();
  
  console.log(`\nTotal reports: ${reports.results.length}`);
  
  for (const report of reports.results) {
    console.log(`\nReport ID: ${report.id}`);
    console.log(`  Assessment: ${report.assessment_id} (${report.preferred_country})`);
    console.log(`  Payment: ${report.payment_id}`);
    console.log(`  Download Token: ${report.download_token}`);
    console.log(`  Expires: ${report.download_expires_at}`);
    console.log(`  PDF URL: ${report.pdf_url}`);
    console.log(`  Created: ${report.created_at}`);
  }
  
  // Check for orphaned payments (no reports)
  const orphanedPayments = await db.prepare(`
    SELECT p.id, p.assessment_id, p.status, p.stripe_payment_intent_id
    FROM payments p 
    LEFT JOIN reports r ON p.assessment_id = r.assessment_id 
    WHERE p.status = 'succeeded' AND r.id IS NULL
  `).all();
  
  if (orphanedPayments.results.length > 0) {
    console.log(`\n!!! ORPHANED PAYMENTS (succeeded but no report): ${orphanedPayments.results.length}`);
    for (const orphan of orphanedPayments.results) {
      console.log(`  Payment ${orphan.id}: Assessment ${orphan.assessment_id}, PI: ${orphan.stripe_payment_intent_id}`);
    }
  }
  
  console.log("=== END DEBUG REPORT ===");
}
