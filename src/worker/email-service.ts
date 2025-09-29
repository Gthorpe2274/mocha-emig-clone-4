import { Resend } from 'resend';

export interface EmailData {
  country: string;
  city?: string;
  downloadToken: string;
  customerName: string;
  expiresAt: string;
  assessmentId?: number;
}

export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
    // Use resend's default domain which is always verified
    this.fromEmail = 'Emigration Pro <onboarding@resend.dev>';
  }

  async sendReportEmail(toEmail: string, data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const location = data.city ? `${data.city}, ${data.country}` : data.country;
      const directDownloadUrl = `https://pldgsaxsut5fa.mocha.app/api/reports/download/${data.downloadToken}`;
      const resultsPageUrl = data.assessmentId ? `https://pldgsaxsut5fa.mocha.app/results/${data.assessmentId}` : '';
      const relocationHubUrl = data.assessmentId ? `https://pldgsaxsut5fa.mocha.app/relocation-hub/${data.assessmentId}` : '';

      const subject = `🎉 Your ${location} Emigration Report is Ready!`;
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Emigration Report is Ready</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; }
    .download-button { display: inline-block; background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .download-button:hover { background: linear-gradient(135deg, #218838, #1ea085); }
    .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .warning-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .feature-list { background: #f1f8e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature-list ul { margin: 0; padding-left: 20px; }
    .feature-list li { margin: 8px 0; }
    .small-text { font-size: 12px; color: #666; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🎉 Your Report is Ready!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Comprehensive Emigration Guide for ${location}</p>
    </div>
    
    <div class="content">
      <p>Dear ${data.customerName},</p>
      
      <p>Your comprehensive emigration report for <span class="bold">${location}</span> has been generated and is ready for download!</p>
      
      <div class="center">
        <a href="${directDownloadUrl}" class="download-button">📥 Download Your Report Now</a>
      </div>
      
      <div class="warning-box">
        <p class="bold">⏰ Important: Download Link Expires in 7 Days</p>
        <p>Your download link expires on <span class="bold">${data.expiresAt}</span>. Please download your report before this date.</p>
      </div>
      
      <div class="info-box">
        <p class="bold">Alternative Access Methods:</p>
        <p>If the direct download link doesn't work, you can also access your report through:</p>
        <ul>
          ${resultsPageUrl ? `<li><a href="${resultsPageUrl}">Your Results Page</a></li>` : ''}
          ${relocationHubUrl ? `<li><a href="${relocationHubUrl}">Your Relocation Hub</a></li>` : ''}
        </ul>
        <p>Look for the "✅ Report Ready!" section and click "Download PDF".</p>
      </div>
      
      <div class="feature-list">
        <p class="bold">📋 Your Report Includes:</p>
        <ul>
          <li>✅ Current immigration requirements and visa options specific to your situation</li>
          <li>✅ Detailed cost of living analysis for your preferred location</li>
          <li>✅ Healthcare system guide and insurance options</li>
          <li>✅ Tax implications and financial planning strategies</li>
          <li>✅ Housing market and neighborhood recommendations</li>
          <li>✅ Cultural integration resources and language tips</li>
          <li>✅ Step-by-step relocation timeline (18-month plan)</li>
          <li>✅ Emergency contacts and support resources</li>
          <li>✅ Professional service provider contacts</li>
        </ul>
      </div>
      
      <div class="info-box">
        <p class="bold">📌 Important Notes:</p>
        <ul>
          <li>Your download link remains active for exactly 7 days from today</li>
          <li>After 7 days, you can still access your report by visiting your Results page</li>
          <li>Your personalized Relocation Hub access is retained for 2 years</li>
          <li>Keep this email for your records - it contains your personal access links</li>
        </ul>
      </div>
      
      <div class="center">
        <p class="bold">🚀 Next Steps:</p>
        <ol style="text-align: left; display: inline-block;">
          <li>Download your report using the button above</li>
          ${resultsPageUrl ? `<li>Bookmark your <a href="${resultsPageUrl}">Results page</a> for future reference</li>` : ''}
          ${relocationHubUrl ? `<li>Explore your <a href="${relocationHubUrl}">Relocation Hub</a> for ongoing support</li>` : ''}
        </ol>
      </div>
      
      <p>Thank you for choosing Emigration Pro for your relocation journey!</p>
      
      <p>Best regards,<br>
      <span class="bold">The Emigration Pro Team</span></p>
    </div>
    
    <div class="footer">
      <p class="small-text">
        This email was sent to: ${toEmail}<br>
        Report ID: ${data.downloadToken.substring(0, 8)}...<br>
        Generated: ${new Date().toLocaleDateString()}<br><br>
        If you did not request this report, please ignore this email.<br>
        For support, contact us at <a href="mailto:info@emigrationpro.com">info@emigrationpro.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

      const textContent = `
Dear ${data.customerName},

🎉 Your comprehensive emigration report for ${location} is ready for download!

=== DIRECT DOWNLOAD LINK ===
${directDownloadUrl}

⏰ IMPORTANT: This download link expires in exactly 7 days (${data.expiresAt})

=== ALTERNATIVE ACCESS METHODS ===
If the direct link doesn't work, you can also access your report by visiting:
${resultsPageUrl ? `📋 Your Results Page: ${resultsPageUrl}` : ''}
${relocationHubUrl ? `🏠 Your Relocation Hub: ${relocationHubUrl}` : ''}

=== YOUR REPORT INCLUDES ===
✅ Current immigration requirements and visa options specific to your situation
✅ Detailed cost of living analysis for your preferred location
✅ Healthcare system guide and insurance options
✅ Tax implications and financial planning strategies
✅ Housing market and neighborhood recommendations
✅ Cultural integration resources and language tips
✅ Step-by-Step relocation timeline (18-month plan)
✅ Emergency contacts and support resources
✅ Professional service provider contacts

=== IMPORTANT NOTES ===
• Your download link will remain active for exactly 7 days from today
• After 7 days, you can still access your report by visiting your Results page
• Your personalized Relocation Hub access is retained for 2 years
• Keep this email for your records - it contains your personal access links

=== NEXT STEPS ===
1. Download your report using the direct link above
${resultsPageUrl ? `2. Bookmark your Results page for future reference: ${resultsPageUrl}` : ''}
${relocationHubUrl ? `3. Explore your Relocation Hub for ongoing support: ${relocationHubUrl}` : ''}

Thank you for choosing Emigration Pro for your relocation journey!

Best regards,
The Emigration Pro Team

---
This email was sent to: ${toEmail}
Report ID: ${data.downloadToken.substring(0, 8)}...
Generated: ${new Date().toLocaleDateString()}

If you did not request this report, please ignore this email.
For support, contact us at info@emigrationpro.com
      `.trim();

      console.log(`📧 Sending email to: ${toEmail}`);
      console.log(`📧 Subject: ${subject}`);

      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: [toEmail],
        subject: subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'category', value: 'report-delivery' },
          { name: 'country', value: data.country.toLowerCase().replace(/\s+/g, '-') },
          { name: 'assessment-id', value: data.assessmentId?.toString() || 'unknown' }
        ]
      });

      console.log('📧 Resend API response:', JSON.stringify(response, null, 2));

      if (response.data) {
        console.log(`✅ Email sent successfully! Message ID: ${response.data.id}`);
        return { success: true, messageId: response.data.id };
      } else if (response.error) {
        console.error('❌ Email send failed with error:', response.error);
        return { success: false, error: `Resend API error: ${response.error.message || 'Unknown error'}` };
      } else {
        console.error('❌ Email send failed - no response data or error');
        console.error('Full response:', response);
        return { success: false, error: 'No response data from email service' };
      }
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      };
    }
  }

  async sendTestEmail(toEmail: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const subject = '✅ Emigration Pro Email Service Test';
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Service Test</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 500px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px; }
    .content { background: white; padding: 20px; border: 1px solid #e0e0e0; margin-top: 10px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Email Test Successful!</h1>
    </div>
    <div class="content">
      <p>Congratulations! Your Emigration Pro email delivery system is working correctly.</p>
      <p><strong>Test Details:</strong></p>
      <ul>
        <li>Sent to: ${toEmail}</li>
        <li>Timestamp: ${new Date().toLocaleString()}</li>
        <li>Service: Resend via Cloudflare Workers</li>
      </ul>
      <p>Your customers will now receive beautifully formatted emails when their reports are ready for download.</p>
    </div>
  </div>
</body>
</html>`;

      const textContent = `
✅ Email Test Successful!

Congratulations! Your Emigration Pro email delivery system is working correctly.

Test Details:
- Sent to: ${toEmail}
- Timestamp: ${new Date().toLocaleString()}
- Service: Resend via Cloudflare Workers

Your customers will now receive beautifully formatted emails when their reports are ready for download.
      `.trim();

      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: [toEmail],
        subject: subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'category', value: 'test-email' },
          { name: 'timestamp', value: Date.now().toString() }
        ]
      });

      console.log('📧 Resend API test response:', JSON.stringify(response, null, 2));

      if (response.data) {
        console.log(`✅ Test email sent successfully! Message ID: ${response.data.id}`);
        return { success: true, messageId: response.data.id };
      } else if (response.error) {
        console.error('❌ Test email send failed with error:', response.error);
        return { success: false, error: `Resend API error: ${response.error.message || 'Unknown error'}` };
      } else {
        console.error('❌ Test email send failed - no response data or error');
        console.error('Full test response:', response);
        return { success: false, error: 'No response data from email service' };
      }
    } catch (error) {
      console.error('❌ Test email sending error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      };
    }
  }
}
