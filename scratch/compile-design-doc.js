const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePDF() {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const destPath = path.join(__dirname, '../google_ads_api_design_document.pdf');
  doc.pipe(fs.createWriteStream(destPath));

  // --- Header ---
  doc.fillColor('#1e293b') // Slate-800
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('Techleads IT SEO & Ads Dashboard', { align: 'center' });
  
  doc.fillColor('#4f46e5') // Indigo-600
     .fontSize(14)
     .font('Helvetica')
     .text('Google Ads API Integration Design Document', { align: 'center' });

  doc.moveDown(1.5);

  // Horizontal Rule
  doc.strokeColor('#e2e8f0')
     .lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .stroke();

  doc.moveDown(1.5);

  // --- Section 1 ---
  doc.fillColor('#1e293b')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('1. Overview & Purpose');
  doc.moveDown(0.5);

  doc.fillColor('#334155') // Slate-700
     .fontSize(11)
     .font('Helvetica')
     .text(
       'Techleads IT is an online IT training provider offering high-quality professional courses in Oracle Fusion Financials, Oracle Fusion SCM, Oracle Fusion Technical OIC, Oracle Fusion HCM, etc. We use Google Ads Search campaigns to drive student enrollment inquiries.\n\n' +
       'We have built an internal, custom web reporting dashboard. The purpose of this dashboard is to unify keyword performance data from search engine results (SEO rankings), Google Ads campaigns, and lead statuses from our CRM (TeleCRM) into a single unified analytical view. This allows us to track keyword pacing and prioritize course content creation.',
       { align: 'justify', lineGap: 3 }
     );

  doc.moveDown(2);

  // --- Section 2 ---
  doc.fillColor('#1e293b')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('2. Google Ads API Use Cases');
  doc.moveDown(0.5);

  doc.fillColor('#334155')
     .fontSize(11)
     .font('Helvetica')
     .text('Our custom tool connects to the Google Ads API for two primary read-only use cases:', { lineGap: 3 });
  
  doc.moveDown(0.5);

  const bullets = [
    'Campaign & Ad Group Reporting: Pulling aggregated performance reports (impressions, clicks, conversions, CTR, CPC, and ad spend) for our search campaigns to compare organic SEO keyword rankings with our active paid Google Ads keyword targeting.',
    'Search Volume Forecasting: Querying the Google Ads API KeywordPlanIdeaService (GenerateKeywordIdeas) to retrieve estimated monthly search volumes for India (geoTargetConstants/2356, languageConstants/1000) for our organic target keywords. This helps our content marketing team identify high-demand Oracle Fusion courses.'
  ];

  bullets.forEach(b => {
    doc.fillColor('#4f46e5').text('• ', { continued: true });
    doc.fillColor('#334155').text(b, { lineGap: 3 });
    doc.moveDown(0.5);
  });

  doc.moveDown(1.5);

  // --- Section 3 ---
  doc.fillColor('#1e293b')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('3. System Architecture & Security');
  doc.moveDown(0.5);

  doc.fillColor('#334155')
     .fontSize(11)
     .font('Helvetica')
     .text(
       '• Storage: OAuth credentials, client secrets, and refresh tokens are stored securely server-side in a private database (Supabase PostgreSQL) using AES encryption. No developer tokens or secret keys are exposed to the frontend browser.\n\n' +
       '• Data Pipeline: The Next.js backend refreshes access tokens dynamically and acts as an authenticated proxy. It queries campaign statistics and planning metrics from Google Ads REST/gRPC endpoints and sends the aggregated JSON response to the browser.\n\n' +
       '• Access Control: The tool is strictly designed for internal use by employees of Techleads IT. It is restricted to company marketing staff and administrators behind secure JWT logins. It operates entirely as a read-only reporting console and cannot modify campaign bids, status, or budgets.',
       { align: 'justify', lineGap: 3 }
     );

  doc.end();
  console.log('PDF successfully compiled.');
}

generatePDF();
