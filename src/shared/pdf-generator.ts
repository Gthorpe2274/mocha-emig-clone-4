import jsPDF from 'jspdf';

// Ensure compatibility with Mocha's internal PDF generator
interface GeneratedReport {
  title: string;
  country: string;
  city: string | undefined; // ← critical: must NOT be null or {}
  generatedAt: string;
  enhancementLevel?: number;
  overallConfidence?: string;
  totalSources?: number;
  executiveSummary: string;
  sections: {
    title: string;
    content: string;
    subsections?: Array<{
      title: string;
      content: string;
    }>;
    metadata?: Record<string, unknown>;
  }[];
  metadata?: Record<string, unknown>;
  assessmentId?: number;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private currentY: number;
  private margin: number;
  private pageWidth: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = 20;
    this.margin = 20;
  }

  async generateReportPDF(report: GeneratedReport, _assessmentId?: number): Promise<Uint8Array> {
    // Reset document
    this.doc = new jsPDF();
    this.currentY = 20;

    // Title Page
    this.addTitlePage(report);
    
    // Table of Contents
    this.addNewPage();
    this.addTableOfContents(report);
    
    // Executive Summary
    this.addNewPage();
    this.addSection('Executive Summary', report.executiveSummary);
    
    // All Report Sections
    for (const section of report.sections) {
      this.addNewPage();
      this.addSection(section.title, section.content);
      
      if (section.subsections) {
        for (const subsection of section.subsections) {
          this.addSubsection(subsection.title, subsection.content);
        }
      }
    }

    // Add Relocation Hub CTA Section
    this.addNewPage();
    this.addRelocationHubCTA(report);

    // Footer on all pages
    this.addFooters(report);
    
    return this.doc.output('arraybuffer') as Uint8Array;
  }

  private addTitlePage(report: GeneratedReport): void {
    // Main Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    const titleLines = this.doc.splitTextToSize(report.title, this.pageWidth - 2 * this.margin);
    this.doc.text(titleLines, this.margin, 40);
    
    // Subtitle
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Professional Emigration Assessment Report`, this.margin, 65);
    
    // Destination Info
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Destination: ${report.country}`, this.margin, 85);
    if (report.city) {
      this.doc.text(`City: ${report.city}`, this.margin, 100);
    }
    
    // Generation Date
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    const date = new Date(report.generatedAt).toLocaleDateString();
    this.doc.text(`Generated: ${date}`, this.margin, 120);
    
    // Disclaimer Box
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'italic');
    const disclaimer = `This report provides general guidance based on current information and should not be considered legal advice. Immigration laws and regulations change frequently. Consult with qualified professionals for your specific situation.`;
    const disclaimerLines = this.doc.splitTextToSize(disclaimer, this.pageWidth - 4 * this.margin);
    
    // Draw box around disclaimer
    const boxHeight = disclaimerLines.length * 5 + 10;
    this.doc.rect(this.margin, 150, this.pageWidth - 2 * this.margin, boxHeight);
    this.doc.text(disclaimerLines, this.margin + 5, 160);
    
    // Professional Services Footer
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Emigration Pro', this.margin, this.pageHeight - 40);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Expert emigration guidance for US citizens', this.margin, this.pageHeight - 30);
  }

  private addTableOfContents(report: GeneratedReport): void {
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Table of Contents', this.margin, this.currentY);
    this.currentY += 20;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    const contents = [
      'Executive Summary',
      ...report.sections.map(section => section.title)
    ];
    
    let pageNum = 3; // Starting after title and ToC
    contents.forEach(content => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      
      // Add dots between title and page number
      const dots = '.'.repeat(Math.floor((this.pageWidth - this.margin * 2 - this.doc.getTextWidth(content) - this.doc.getTextWidth(pageNum.toString())) / this.doc.getTextWidth('.')));
      
      this.doc.text(`${content} ${dots} ${pageNum}`, this.margin, this.currentY);
      this.currentY += 8;
      pageNum++;
    });
  }

  private addSection(title: string, content: string): void {
    // Section Title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 15;
    
    // Section Content
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.addParagraphs(content);
  }

  private addSubsection(title: string, content: string): void {
    if (content === 'Detailed in main content above') return;
    
    this.currentY += 10;
    
    // Subsection Title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 10, this.currentY);
    this.currentY += 12;
    
    // Subsection Content
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.addParagraphs(content);
  }

  private addParagraphs(text: string): void {
    // Split by paragraphs (double newlines) and handle formatting
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    paragraphs.forEach(paragraph => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      
      // Handle bullet points
      if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('• ')) {
        this.addBulletPoints(paragraph);
      } else if (paragraph.includes(':') && paragraph.split(':')[0].length < 100) {
        // Handle headers with colons
        this.addFormattedParagraph(paragraph);
      } else {
        // Regular paragraph
        this.addRegularParagraph(paragraph);
      }
      
      this.currentY += 8;
    });
  }

  private addBulletPoints(text: string): void {
    const bullets = text.split('\n').filter(line => line.trim());
    bullets.forEach(bullet => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      
      const cleanBullet = bullet.replace(/^[\s-•]*/, '').trim();
      const lines = this.doc.splitTextToSize(`• ${cleanBullet}`, this.pageWidth - this.margin * 2 - 10);
      
      lines.forEach((line: string, index: number) => {
        this.doc.text(line, this.margin + (index === 0 ? 0 : 10), this.currentY);
        this.currentY += 5;
      });
    });
  }

  private addFormattedParagraph(text: string): void {
    const [header, ...contentParts] = text.split(':');
    if (contentParts.length === 0) {
      this.addRegularParagraph(text);
      return;
    }
    
    // Header in bold
    this.doc.setFont('helvetica', 'bold');
    const headerLines = this.doc.splitTextToSize(`${header.trim()}:`, this.pageWidth - this.margin * 2);
    headerLines.forEach((line: string) => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 5;
    });
    
    // Content in normal font
    this.doc.setFont('helvetica', 'normal');
    const content = contentParts.join(':').trim();
    if (content) {
      const contentLines = this.doc.splitTextToSize(content, this.pageWidth - this.margin * 2);
      contentLines.forEach((line: string) => {
        if (this.currentY > this.pageHeight - 30) {
          this.addNewPage();
        }
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 5;
      });
    }
  }

  private addRegularParagraph(text: string): void {
    const lines = this.doc.splitTextToSize(text.trim(), this.pageWidth - this.margin * 2);
    lines.forEach((line: string) => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 5;
    });
  }

  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = 20;
  }

  private addRelocationHubCTA(report: GeneratedReport & { assessmentId?: number }): void {
    // Section Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Your Personal Relocation Hub', this.margin, this.currentY);
    this.currentY += 20;
    
    // Introduction text
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    const introText = `This comprehensive report provides you with essential guidance for your emigration to ${report.country}. However, your journey doesn't end here. We've created a personalized online Relocation Hub specifically for your destination that complements this static document with dynamic, up-to-date resources.`;
    const introLines = this.doc.splitTextToSize(introText, this.pageWidth - this.margin * 2);
    introLines.forEach((line: string) => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 6;
    });
    
    this.currentY += 10;
    
    // What's included section
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Your Relocation Hub Includes:', this.margin, this.currentY);
    this.currentY += 15;
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    const hubFeatures = [
      'Real-time YouTube videos and experiences from Americans living in your destination',
      'Verified professional service providers (immigration lawyers, tax advisors, banking)',
      'Join with others seeking to emigrate for support',
      'Updated costs and practical tips that change over time',
      'Emergency contacts and support resources',
      'Cultural integration guides and language resources'
    ];
    
    hubFeatures.forEach(feature => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      this.doc.text(`• ${feature}`, this.margin + 5, this.currentY);
      this.currentY += 8;
    });
    
    this.currentY += 15;
    
    // Access information
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('How to Access Your Hub:', this.margin, this.currentY);
    this.currentY += 15;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    if (report.assessmentId) {
      const hubUrl = `https://pldgsaxsut5fa.mocha.app/relocation-hub/${report.assessmentId}`;
      const accessText = `Your personalized Relocation Hub is available online at any time. Simply visit the link below or scan the QR code to access your hub:`;
      
      const accessLines = this.doc.splitTextToSize(accessText, this.pageWidth - this.margin * 2);
      accessLines.forEach((line: string) => {
        if (this.currentY > this.pageHeight - 30) {
          this.addNewPage();
        }
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 6;
      });
      
      this.currentY += 10;
      
      // Add the URL in a box
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFillColor(240, 240, 240);
      const urlBoxHeight = 15;
      this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, urlBoxHeight, 'F');
      this.doc.text(hubUrl, this.margin + 5, this.currentY + 5);
      this.currentY += urlBoxHeight + 10;
    } else {
      const genericText = `Your Relocation Hub is accessible through your original results page. Simply bookmark the page or save the link from your browser when you first access your results.`;
      const genericLines = this.doc.splitTextToSize(genericText, this.pageWidth - this.margin * 2);
      genericLines.forEach((line: string) => {
        if (this.currentY > this.pageHeight - 30) {
          this.addNewPage();
        }
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 6;
      });
      this.currentY += 15;
    }
    
    // Important note
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'italic');
    const noteText = `Important: Your Relocation Hub provides general guidance and community insights. For legal immigration advice specific to your situation, always consult with qualified immigration professionals listed in your hub.`;
    const noteLines = this.doc.splitTextToSize(noteText, this.pageWidth - this.margin * 2);
    
    // Draw box around note
    const noteBoxHeight = noteLines.length * 6 + 10;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, noteBoxHeight);
    
    noteLines.forEach((line: string) => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      this.doc.text(line, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
    
    this.currentY += 15;
    
    // Closing message
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    const closingText = `Best of luck with your emigration journey! Your Relocation Hub will be there to support you every step of the way.`;
    const closingLines = this.doc.splitTextToSize(closingText, this.pageWidth - this.margin * 2);
    closingLines.forEach((line: string) => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 6;
    });
  }

  private addFooters(report: GeneratedReport): void {
    const totalPages = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      
      // Page number
      this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin - 20, this.pageHeight - 10);
      
      // Report title and generation date
      this.doc.text(`${report.country} Emigration Report`, this.margin, this.pageHeight - 10);
      
      // Generated date
      const date = new Date(report.generatedAt).toLocaleDateString();
      this.doc.text(`Generated: ${date}`, this.pageWidth / 2 - 20, this.pageHeight - 10);
    }
  }
}
