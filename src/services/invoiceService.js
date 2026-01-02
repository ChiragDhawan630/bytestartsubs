const PDFDocument = require('pdfkit');
const fs = require('fs');
const axios = require('axios'); // Needed for fetching remote logo

async function generateInvoice(data, dataCallback, endCallback) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  await generateHeader(doc, data);
  generateCustomerInformation(doc, data);
  generateInvoiceTable(doc, data);
  generateFooter(doc, data);

  doc.end();
}

async function generateHeader(doc, data) {
  const settings = data.settings || {};

  // Logo
  if (settings.logo_url) {
    try {
      const response = await axios.get(settings.logo_url, {
        responseType: 'arraybuffer',
      });
      const logo = Buffer.from(response.data, 'binary');
      doc.image(logo, 40, 50, { width: 60 });
    } catch (e) {
      console.error('Error loading logo:', e.message);
    }
  }

  // Header Layout: Two Columns
  const leftColX = 40;
  const leftColWidth = 300;
  const rightColX = 350;
  const rightColWidth = 200;
  const startY = 120; // Start below logo (increased padding)

  // --- Left Column: Company Info ---
  let currentLeftY = 45; // Start aligned with logo top roughly if text is there, but logo is at 40.
  // Actually, let's put company name next to logo if it fits, or below.
  // Designs usually have Logo Left, Tax Invoice Right. Company info below Logo.

  // Title (Company Name)
  doc
    .fillColor('#1e293b') // Dark slate
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(
      settings.company_name?.toUpperCase() || 'BYTESTART TECHNOLOGIES',
      leftColX,
      startY,
      { width: leftColWidth }
    );

  // Address Block (Flowing)
  doc.fontSize(9).font('Helvetica');
  doc.moveDown(0.5);

  if (settings.company_address) {
    doc.text(settings.company_address, { width: leftColWidth });
  }

  const cityLine = [settings.company_city, settings.company_state, settings.company_pincode]
    .filter(Boolean).join(' - ');
  if (cityLine) {
    doc.text(cityLine, { width: leftColWidth });
  }

  if (settings.company_phone) {
    doc.text(`Phone: ${settings.company_phone}`, { width: leftColWidth });
  }

  if (settings.company_email) {
    doc.text(`Email: ${settings.company_email}`, { width: leftColWidth });
  }

  if (settings.company_gstin || settings.company_pan) {
    doc.moveDown(0.5);
    if (settings.company_gstin) {
      doc.font('Helvetica-Bold').text('GSTIN: ', { continued: true }).font('Helvetica').text(settings.company_gstin);
    }
    if (settings.company_pan) {
      doc.font('Helvetica-Bold').text('PAN: ', { continued: true }).font('Helvetica').text(settings.company_pan);
    }
  }

  const endLeftY = doc.y;

  // --- Right Column: Invoice Details ---
  // Reset Y to top
  const topY = 45;

  doc
    .fillColor('#444444')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('TAX INVOICE', rightColX, topY, { align: 'right', width: rightColWidth });

  doc.fontSize(10).font('Helvetica');
  let currentRightY = 80;

  const drawRightRow = (label, value) => {
    doc.text(label, rightColX, currentRightY, { align: 'right', width: 90 });
    doc.text(value, rightColX + 100, currentRightY, { align: 'right', width: 100 });
    currentRightY += 15;
  };

  drawRightRow('Invoice #', data.invoice.invoice_number);
  drawRightRow('Date', formatDate(new Date(data.invoice.invoice_date)));
  drawRightRow('Due Date', formatDate(new Date(data.invoice.due_date)));

  // Divider
  // Ensure we are below both columns
  const maxY = Math.max(endLeftY, currentRightY) + 20;
  generateHr(doc, maxY);

  // Set Y for next section
  doc.y = maxY + 20;
}

function generateCustomerInformation(doc, data) {
  const customer = data.customer;
  const startY = doc.y;
  const leftPadding = 45;
  const contentWidth = 300; // Increased from 250 to prevent truncation

  // Section header with background
  doc.rect(40, startY - 5, contentWidth + 10, 20).fill('#f1f5f9');
  doc
    .fillColor('#1e293b')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Bill To:', leftPadding, startY);

  // Customer details with proper spacing
  doc.moveDown(0.8);
  const contentY = doc.y + 5;
  doc.fontSize(10).font('Helvetica-Bold');

  // Customer name - bold with explicit x positioning
  doc.text(customer.name || 'N/A', leftPadding, contentY, {
    width: contentWidth,
    lineBreak: true
  });
  doc.moveDown(0.3);
  doc.font('Helvetica');

  // Address - allow full text wrapping
  if (customer.address) {
    doc.text(customer.address, leftPadding, doc.y, {
      width: contentWidth,
      lineBreak: true
    });
    doc.moveDown(0.1);
  }

  // City, State, Pincode line
  const cityLine = [customer.city, customer.state, customer.pincode]
    .filter(Boolean)
    .join(', ');
  if (cityLine) {
    doc.text(cityLine, leftPadding, doc.y, {
      width: contentWidth,
      lineBreak: true
    });
    doc.moveDown(0.1);
  }

  // Phone
  if (customer.phone) {
    doc.text(`Phone: ${customer.phone}`, leftPadding, doc.y, { width: contentWidth });
    doc.moveDown(0.1);
  }

  // Email (if available)
  if (customer.email) {
    doc.text(`Email: ${customer.email}`, leftPadding, doc.y, { width: contentWidth });
    doc.moveDown(0.1);
  }

  // GSTIN
  if (customer.gstin) {
    doc.moveDown(0.2);
    doc
      .font('Helvetica-Bold')
      .text('GSTIN: ', leftPadding, doc.y, { continued: true, width: contentWidth })
      .font('Helvetica')
      .text(customer.gstin);
  }

  // Add some spacing after the Bill To section
  doc.moveDown(1);
}

function generateFooter(doc, data) {
  const settings = data.settings || {};
  let y = 650;

  // Bank Details (left side)
  if (settings.company_bank_account) {
    doc
      .fillColor('#1e293b')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Bank Details:', 40, y);
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(`Bank Name: ${settings.company_bank_name || '-'}`, 40, y + 15)
      .text(`A/c No: ${settings.company_bank_account}`, 40, y + 30)
      .text(`IFSC: ${settings.company_bank_ifsc || '-'}`, 40, y + 45)
      .text(`Branch: ${settings.company_bank_branch || '-'}`, 40, y + 60);

    // Add UPI if available
    if (settings.company_upi_id) {
      doc.text(`UPI: ${settings.company_upi_id}`, 40, y + 75);
    }
  }

  // PAN Number (right side, under bank details heading level)
  if (settings.company_pan) {
    doc
      .fillColor('#1e293b')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('PAN: ', 350, y + 15, { continued: true })
      .font('Helvetica')
      .text(settings.company_pan);
  }

  // Signature (right side)
  if (settings.invoice_signature_url) {
    try {
      // Note: Signature image would need to be fetched async, but for now show placeholder
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('Authorized Signatory', 350, y + 55, { width: 150, align: 'right' });
    } catch (e) {
      console.error('Error adding signature:', e.message);
    }
  }

  // Invoice Terms/Notes (above the final signature line)
  if (settings.invoice_terms) {
    const termsY = settings.company_bank_account ? y + 95 : y + 20;
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(settings.invoice_terms, 40, termsY, { width: 510, align: 'left' });
  }

  // Bottom Signature Line
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(
      'This invoice is computer-generated and requires no signature.',
      40,
      760,
      { align: 'center', width: 500 }
    );
}

function generateInvoiceTable(doc, data) {
  let i;
  const invoiceTableTop = 330;
  const tableWidth = 515;
  const tableLeft = 40;
  const tableRight = tableLeft + tableWidth;
  const rowHeight = 25;
  const headerHeight = 22;

  // Column positions
  const col1 = 40; // Item
  const col2 = 220; // HSN
  const col3 = 290; // Rate
  const col4 = 370; // Qty
  const col5 = 430; // Amount

  // Draw table outer border
  doc.strokeColor('#94a3b8').lineWidth(1);

  // Header Background with border
  doc
    .rect(tableLeft, invoiceTableTop - 5, tableWidth, headerHeight)
    .fill('#1e293b'); // Dark header

  // Header text (white on dark) - with proper vertical centering
  const headerTextY = invoiceTableTop + 3; // Center text in header
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  doc.text('Description', col1 + 8, headerTextY, { width: 165 });
  doc.text('HSN/SAC', col2 + 8, headerTextY, { width: 55 });
  doc.text('Rate', col3 + 8, headerTextY, { width: 65 });
  doc.text('Qty', col4 + 8, headerTextY, { width: 45 });
  doc.text('Amount', col5 + 8, headerTextY, { width: 75 });

  doc.fillColor('#1e293b').font('Helvetica'); // Reset

  let items = data.items || [];
  let position = invoiceTableTop + headerHeight;
  let lastRowBottom = position;

  // Draw items with borders
  for (i = 0; i < items.length; i++) {
    const item = items[i];
    const rowTop = position;

    // Prevent page break overlap (footer starts at 650)
    if (rowTop > 610) {
      // Close table border before page break
      doc
        .strokeColor('#94a3b8')
        .lineWidth(1)
        .rect(
          tableLeft,
          invoiceTableTop - 5,
          tableWidth,
          lastRowBottom - (invoiceTableTop - 5)
        )
        .stroke();

      doc.addPage();
      position = 50;
    }

    // Alternating row background
    if (i % 2 === 1) {
      doc.rect(tableLeft, rowTop, tableWidth, rowHeight).fill('#f8fafc');
      doc.fillColor('#1e293b');
    }

    // Row content - with proper padding
    const cellPadding = 8;
    const textY = rowTop + 8; // Vertical padding from top of row
    doc.fontSize(9);
    doc.text(item.description, col1 + cellPadding, textY, { width: 165 });
    doc.text(item.hsn_code || '-', col2 + cellPadding, textY, { width: 55 });
    doc.text(formatCurrency(item.rate), col3 + cellPadding, textY, {
      width: 65,
    });
    doc.text(String(item.quantity), col4 + cellPadding, textY, { width: 45 });
    doc.text(formatCurrency(item.amount), col5 + cellPadding, textY, {
      width: 75,
    });

    // Row bottom border
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(0.5)
      .moveTo(tableLeft, rowTop + rowHeight)
      .lineTo(tableRight, rowTop + rowHeight)
      .stroke();

    position += rowHeight;
    lastRowBottom = position;
  }

  // Draw column dividers
  doc.strokeColor('#cbd5e1').lineWidth(0.5);
  const tableBottom = lastRowBottom;
  const columnsX = [col2, col3, col4, col5];
  columnsX.forEach((x) => {
    doc
      .moveTo(x, invoiceTableTop - 5)
      .lineTo(x, tableBottom)
      .stroke();
  });

  // Draw outer table border
  doc
    .strokeColor('#64748b')
    .lineWidth(1)
    .rect(
      tableLeft,
      invoiceTableTop - 5,
      tableWidth,
      tableBottom - (invoiceTableTop - 5)
    )
    .stroke();

  const subtotalPosition = position + 40;
  const invoice = data.invoice;

  // Totals Block with border
  const xLabel = 350;
  const xValue = 450;
  const totalsLeft = xLabel - 15;
  const totalsWidth = 220;
  let y = subtotalPosition;

  // Calculate totals block height
  let rowCount = 1; // Subtotal
  if (invoice.igst_rate > 0) rowCount++;
  else {
    if (invoice.cgst_rate > 0) rowCount++;
    if (invoice.sgst_rate > 0) rowCount++;
  }
  const totalsBlockHeight = rowCount * 20 + 45; // Extra for total row

  // Draw totals border box
  doc
    .strokeColor('#94a3b8')
    .lineWidth(1)
    .rect(totalsLeft, y - 8, totalsWidth, totalsBlockHeight)
    .stroke();

  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Subtotal:', xLabel, y, { align: 'right', width: 90 });
  doc.text(formatCurrency(invoice.subtotal), xValue, y, {
    align: 'right',
    width: 90,
  });
  y += 20;

  // Taxes
  if (invoice.igst_rate > 0) {
    doc.font('Helvetica');
    doc.text(`IGST (${invoice.igst_rate}%):`, xLabel, y, {
      align: 'right',
      width: 90,
    });
    doc.text(formatCurrency(invoice.igst_amount), xValue, y, {
      align: 'right',
      width: 90,
    });
    y += 20;
  } else {
    if (invoice.cgst_rate > 0) {
      doc.font('Helvetica');
      doc.text(`CGST (${invoice.cgst_rate}%):`, xLabel, y, {
        align: 'right',
        width: 90,
      });
      doc.text(formatCurrency(invoice.cgst_amount), xValue, y, {
        align: 'right',
        width: 90,
      });
      y += 20;
    }
    if (invoice.sgst_rate > 0) {
      doc.font('Helvetica');
      doc.text(`SGST (${invoice.sgst_rate}%):`, xLabel, y, {
        align: 'right',
        width: 90,
      });
      doc.text(formatCurrency(invoice.sgst_amount), xValue, y, {
        align: 'right',
        width: 90,
      });
      y += 20;
    }
  }

  // Grand Total Box with border
  y += 5;
  doc.rect(totalsLeft, y - 5, totalsWidth, 28).fill('#1e293b'); // Dark background

  // Add border to grand total box
  doc
    .strokeColor('#0f172a')
    .lineWidth(1)
    .rect(totalsLeft, y - 5, totalsWidth, 28)
    .stroke();

  doc.fillColor('#ffffff'); // White text on dark bg
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('TOTAL:', xLabel - 5, y + 3, { align: 'right', width: 95 });
  doc.text(formatCurrency(invoice.total), xValue - 5, y + 3, {
    align: 'right',
    width: 95,
  });
  doc.fillColor('#1e293b'); // Reset
}

function generateTableRow(doc, y, item, hsn, unitCost, quantity, lineTotal) {
  doc
    .fontSize(9)
    .text(item, 40, y, { width: 180 })
    .text(hsn, 230, y, { width: 60, align: 'center' })
    .text(unitCost, 300, y, { width: 70, align: 'right' })
    .text(quantity, 380, y, { width: 50, align: 'center' })
    .text(lineTotal, 450, y, { width: 90, align: 'right' });
}

function generateHr(doc, y) {
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, y).lineTo(550, y).stroke();
}

function formatCurrency(cents) {
  // Basic formatting
  return 'Rs. ' + (parseFloat(cents) || 0).toFixed(2);
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

module.exports = { generateInvoice };
