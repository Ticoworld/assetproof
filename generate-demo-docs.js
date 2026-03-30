const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public', 'demo-docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const scenarios = [
  // Healthy
  { id: 'aiif-custody-2026-q1.html', title: 'Custody Statement Q1 2026', type: 'Custody Statement', entity: 'HSBC Securities Services', date: '2026-01-15' },
  { id: 'aiif-valuation-2025-dec.html', title: 'Annual Valuation Report 2025', type: 'Valuation Report', entity: 'Colliers International', date: '2025-12-10' },
  { id: 'aiif-sfc-filing.html', title: 'SFC Regulatory Filing', type: 'Legal Filing', entity: 'Clifford Chance LLP', date: '2025-07-05' },
  { id: 'aiif-sfc-registration.html', title: 'SFC Capital Markets Registration', type: 'Regulatory Filing', entity: 'Securities and Futures Commission (SFC)', date: '2025-07-01' },
  
  // Review
  { id: 'sgot-custody-q1-2026.html', title: 'Custody Statement Q1 2026', type: 'Custody Statement', entity: 'Standard Chartered Custody Services', date: '2026-01-01' },
  { id: 'sgot-valuation-2025.html', title: 'Annual Valuation Report 2025', type: 'Valuation Report', entity: 'Jones Lang LaSalle (JLL)', date: '2025-10-15' },
  { id: 'sgot-mas-filing.html', title: 'MAS Legal Filing', type: 'Legal Filing', entity: 'Allen & Gledhill LLP', date: '2025-11-10' },
  { id: 'sgot-mas-registration.html', title: 'MAS Capital Markets Registration', type: 'Regulatory Filing', entity: 'MAS Singapore', date: '2025-11-01' },

  // At Risk
  { id: 'dlwf-custody-2025.html', title: 'Custody Statement 2025', type: 'Custody Statement', entity: 'Emirates NBD Custody', date: '2025-04-01' },
  { id: 'dlwf-difc-filing.html', title: 'DIFC Regulatory Filing', type: 'Legal Filing', entity: 'Linklaters LLP', date: '2024-09-15' },
  { id: 'dlwf-dfsa-registration.html', title: 'DFSA Registration Certificate', type: 'Regulatory Filing', entity: 'Dubai Financial Services Authority (DFSA)', date: '2024-09-01' }
];

const template = (doc) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; padding: 40px; margin: 0; display: flex; justify-content: center; }
        .document { background-color: #ffffff; padding: 60px; max-width: 800px; width: 100%; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e4e4e7; position: relative; }
        .header { border-bottom: 2px solid #e4e4e7; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
        .entity { font-weight: bold; font-size: 1.25rem; color: #27272a; }
        .type { color: #52525b; text-transform: uppercase; font-size: 0.875rem; letter-spacing: 0.05em; }
        h1 { margin: 0 0 10px 0; font-size: 2rem; color: #09090b; }
        .meta { color: #71717a; margin-bottom: 40px; }
        .content { line-height: 1.6; color: #3f3f46; white-space: pre-wrap; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e4e4e7; font-size: 0.875rem; color: #a1a1aa; text-align: center; }
        .stamp { position: absolute; top: 40px; right: 40px; border: 3px solid #10b981; color: #10b981; padding: 10px 20px; font-weight: bold; transform: rotate(15deg); opacity: 0.8; font-family: monospace; letter-spacing: 0.1em; }
    </style>
</head>
<body>
    <div class="document">
        <div class="header">
            <div class="entity">${doc.entity}</div>
            <div class="type">${doc.type}</div>
        </div>
        <h1>${doc.title}</h1>
        <div class="meta">
            <div><strong>Issue Date:</strong> ${doc.date}</div>
            <div><strong>Document ID:</strong> ${Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
        </div>
        <div class="content">
This document serves as the official <strong>${doc.type}</strong> provided by <strong>${doc.entity}</strong>.
        
This record is provided to verify the status, existence, and pertinent details of the referenced asset as of the issue date. The contents of this document are certified to be true and correct according to the records maintained by our institution.

For verification requests or inquiries regarding this document, please reference the Document ID.

(Certified exact copy for AssetProof attestation)
        </div>
        <div class="stamp">VERIFIED COPY</div>
        <div class="footer">
            Confidential & Proprietary &bull; Do not distribute without authorization
        </div>
    </div>
</body>
</html>`;

scenarios.forEach(doc => {
  fs.writeFileSync(path.join(outDir, doc.id), template(doc));
});

console.log('✅ Demo docs generated in public/demo-docs');
