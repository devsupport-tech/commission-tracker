import { jsPDF } from 'jspdf';

/**
 * Generate a clean handoff document PDF for a commission/claim.
 *
 * @param {object} commission - Commission record from the Commissions table
 * @param {object} [extras] - { job, splits }
 *   - job: full claim record from the contractor base (customer, carrier, financials)
 *   - splits: array of company split records for this job
 */
export function generateHandoffPDF(commission, extras = {}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const black = [0, 0, 0];
  const gray = [120, 120, 120];
  const lineColor = [200, 200, 200];
  const job = extras.job || {};

  // --- Title ---
  doc.setFontSize(18);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMISSION HANDOFF', margin, y);
  y += 6;
  separator(doc, margin, y, contentWidth, lineColor);
  y += 8;

  // Date + ID
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin, y);
  doc.text(commission['Job ID'] || '', pageWidth - margin, y, { align: 'right' });
  y += 12;

  // --- Claim ---
  y = sectionLabel(doc, 'Claim', margin, y, gray);
  y = optField(doc, 'Claim ID', commission['Job ID'], margin, y, black, gray);
  y = optField(doc, 'Contractor', commission['Contractor Name'], margin, y, black, gray);
  y = optField(doc, 'Adjuster', commission['Adjuster Name'], margin, y, black, gray);
  y = optField(doc, 'Date', commission['Date Calculated'], margin, y, black, gray);
  y += 4;

  // --- Customer ---
  const customerName = [job['First Name'], job['Last Name']].filter(Boolean).join(' ');
  if (customerName || job['Address'] || job['Customer Phone'] || job['Customer Email']) {
    y = sectionLabel(doc, 'Customer', margin, y, gray);
    y = optField(doc, 'Name', customerName, margin, y, black, gray);
    y = optField(doc, 'Address', job['Address'], margin, y, black, gray);
    y = optField(doc, 'Phone', job['Customer Phone'], margin, y, black, gray);
    y = optField(doc, 'Email', job['Customer Email'], margin, y, black, gray);
    y += 4;
  }

  // --- Insurance ---
  if (job['Carrier'] || job['Policy Number'] || job['Loss Date'] || job['Loss Type']) {
    y = sectionLabel(doc, 'Insurance', margin, y, gray);
    y = optField(doc, 'Carrier', job['Carrier'], margin, y, black, gray);
    y = optField(doc, 'Policy #', job['Policy Number'], margin, y, black, gray);
    y = optField(doc, 'Carrier Claim', job['Carrier Claim #'], margin, y, black, gray);
    y = optField(doc, 'Loss Date', job['Loss Date'], margin, y, black, gray);
    y = optField(doc, 'Loss Type', job['Loss Type'], margin, y, black, gray);
    y += 4;
  }

  // --- Financials ---
  const hasFinancials = job['RCV'] || job['ACV'] || job['Deductible'] || job['Total Payout'];
  if (hasFinancials) {
    y = sectionLabel(doc, 'Financials', margin, y, gray);
    y = optCurrency(doc, 'RCV', job['RCV'], margin, y, black, gray);
    y = optCurrency(doc, 'ACV', job['ACV'], margin, y, black, gray);
    y = optCurrency(doc, 'Deductible', job['Deductible'], margin, y, black, gray);
    y = optCurrency(doc, 'Total Payout', job['Total Payout'], margin, y, black, gray);
    y = optCurrency(doc, 'O&P', job['O&P'], margin, y, black, gray);
    y = optCurrency(doc, 'Net Claim Sum', job['Net Claim Sum'], margin, y, black, gray);
    y += 4;
  }

  // --- Separator before commission ---
  separator(doc, margin, y, contentWidth, lineColor);
  y += 10;

  // --- Commission ---
  y = sectionLabel(doc, 'Commission', margin, y, gray);

  const amount = commission['Commission Amount'] || 0;
  const rate = commission['Rate Applied'] || 0;
  const basis = commission['Commission Basis'] || '% of Revenue';
  const rateStr = basis === 'Flat Rate' ? `$${rate} flat` : `${rate}% of ${basis.replace('% of ', '').toLowerCase()}`;

  // Big amount on its own line
  doc.setFontSize(22);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${amount.toLocaleString()}`, margin, y);
  y += 7;

  // Rate on separate line (fixes overlap)
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.setFont('helvetica', 'normal');
  doc.text(rateStr, margin, y);
  y += 8;

  y = optCurrency(doc, 'Basis Amount', commission['Basis Amount'], margin, y, black, gray);
  y = optField(doc, 'Source', commission['Referral Source Name'], margin, y, black, gray);
  y = optField(doc, 'Status', commission['Status'] || 'Pending', margin, y, black, gray);
  y += 4;

  // --- Payment (if any) ---
  if (commission['Date Approved'] || commission['Date Paid'] || commission['Payment Method']) {
    separator(doc, margin, y, contentWidth, lineColor);
    y += 8;
    y = sectionLabel(doc, 'Payment', margin, y, gray);
    y = optField(doc, 'Approved', commission['Date Approved'], margin, y, black, gray);
    y = optField(doc, 'Paid', commission['Date Paid'], margin, y, black, gray);
    y = optField(doc, 'Method', commission['Payment Method'], margin, y, black, gray);
    y = optField(doc, 'Reference', commission['Payment Reference'], margin, y, black, gray);
    y += 4;
  }

  // --- Partner Splits ---
  if (extras.splits && extras.splits.length > 0) {
    separator(doc, margin, y, contentWidth, lineColor);
    y += 8;
    y = sectionLabel(doc, 'Partner Splits', margin, y, gray);
    for (const split of extras.splits) {
      const name = split['Partner Name'] || '—';
      const pct = split['Partner Percentage'] || 0;
      const amt = split['Split Amount'] || 0;
      y = optField(doc, name, `$${amt.toLocaleString()} (${pct}%)`, margin, y, black, gray);
    }
    y += 4;
  }

  // --- Notes ---
  if (commission['Notes']) {
    separator(doc, margin, y, contentWidth, lineColor);
    y += 8;
    y = sectionLabel(doc, 'Notes', margin, y, gray);
    doc.setFontSize(10);
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(commission['Notes'], contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 6;
  }

  // --- Signature ---
  separator(doc, margin, y, contentWidth, lineColor);
  y += 16;
  doc.setDrawColor(...lineColor);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 70, y);
  doc.line(margin + 90, y, margin + 140, y);
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text('Signature', margin, y + 5);
  doc.text('Date', margin + 90, y + 5);

  // --- Footer ---
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text('Commission Tracker', margin, footerY);
  doc.text('Confidential', pageWidth - margin, footerY, { align: 'right' });

  // Save
  const fileName = `Handoff_${(commission['Job ID'] || 'document').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(fileName);
}

// --- Helpers ---

function separator(doc, x, y, width, color) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  doc.line(x, y, x + width, y);
}

function sectionLabel(doc, text, x, y, color) {
  doc.setFontSize(8);
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'normal');
  doc.text(text.toUpperCase(), x, y);
  return y + 7;
}

// Only render field if value is truthy
function optField(doc, label, value, x, y, valueColor, labelColor) {
  if (!value) return y;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...labelColor);
  doc.text(`${label}:`, x, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...valueColor);
  doc.text(String(value), x + 45, y);
  return y + 6;
}

// Currency field — only render if value > 0
function optCurrency(doc, label, value, x, y, valueColor, labelColor) {
  if (!value && value !== 0) return y;
  if (value === 0) return y;
  return optField(doc, label, `$${Number(value).toLocaleString()}`, x, y, valueColor, labelColor);
}
