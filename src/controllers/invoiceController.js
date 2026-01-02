const db = require('../config/database');
const { logActivity } = require('../utils/logger');
const { generateInvoice } = require('../services/invoiceService');
const { sendInvoiceEmail } = require('../services/emailService');

const getNextInvoiceNumber = async () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const prefix = `IN${dateStr}`;

  try {
    const row = await db.getAsync(
      'SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY invoice_number DESC LIMIT 1',
      [`${prefix}/%`]
    );
    let nextSeq = 1;
    if (row && row.invoice_number) {
      const parts = row.invoice_number.split('/');
      if (parts.length === 2 && !isNaN(parts[1])) {
        nextSeq = parseInt(parts[1], 10) + 1;
      }
    }
    const suffix = String(nextSeq).padStart(2, '0');
    return `${prefix}/${suffix}`;
  } catch (err) {
    console.error('Error getting next invoice number:', err);
    return `${prefix}/01`;
  }
};

const getInvoices = async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT i.*, c.name as customer_name, c.email as customer_email 
       FROM invoices i 
       LEFT JOIN customers c ON i.customer_id = c.id 
       ORDER BY i.created_at DESC`
    );
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getNextNumber = async (req, res) => {
  try {
    const nextNum = await getNextInvoiceNumber();
    res.json({ nextNumber: nextNum });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await db.getAsync(
      `SELECT i.*, c.name as customer_name, c.email as customer_email, c.gstin as customer_gstin, 
              c.address as customer_address, c.city as customer_city, c.state as customer_state, 
              c.pincode as customer_pincode, c.phone as customer_phone 
       FROM invoices i 
       LEFT JOIN customers c ON i.customer_id = c.id 
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const items = await db.allAsync('SELECT * FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    invoice.items = items || [];
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { items, ...invoiceData } = req.body;

    // Scenario 97: Check invalid items
    if (items && items.some(i => i.quantity <= 0 || i.rate < 0)) {
      return res.status(400).json({ error: 'Items must have positive quantity and non-negative rate' });
    }

    // Scenario 81: Missing/Empty Items
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Invoice must have at least one item' });
    }

    // Scenario 82: Customer Existence
    const customer = await db.getAsync('SELECT id FROM customers WHERE id = $1', [req.body.customer_id]);
    if (!customer) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const invoiceNumber = req.body.invoice_number || (await getNextInvoiceNumber());
    const {
      customer_id,
      invoice_date,
      due_date,
      place_of_supply,
      notes,
      payment_terms,
      discount_percent,
      cgst_rate,
      sgst_rate,
      igst_rate,
    } = req.body;

    let subtotal = items?.reduce((sum, i) => sum + i.quantity * i.rate, 0) || 0;
    const discountAmount = (subtotal * (discount_percent || 0)) / 100;
    const taxableAmount = subtotal - discountAmount;
    const isInterState = igst_rate > 0;
    const cgstAmount = isInterState ? 0 : (taxableAmount * (cgst_rate || 9)) / 100;
    const sgstAmount = isInterState ? 0 : (taxableAmount * (sgst_rate || 9)) / 100;
    const igstAmount = isInterState ? (taxableAmount * (igst_rate || 18)) / 100 : 0;
    const total = taxableAmount + cgstAmount + sgstAmount + igstAmount;

    const result = await db.runAsync(
      `INSERT INTO invoices (invoice_number, customer_id, invoice_date, due_date, place_of_supply, subtotal, discount_percent, discount_amount, taxable_amount, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, total, balance_due, notes, payment_terms, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'draft') RETURNING id`,
      [
        invoiceNumber,
        customer_id,
        invoice_date,
        due_date,
        place_of_supply,
        subtotal,
        discount_percent || 0,
        discountAmount,
        taxableAmount,
        cgst_rate || 9,
        sgst_rate || 9,
        igst_rate || 0,
        cgstAmount,
        sgstAmount,
        igstAmount,
        total,
        total,
        notes,
        payment_terms,
      ]
    );

    const invoiceId = result.lastID;

    // Insert items
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO invoice_items (invoice_id, description, hsn_code, quantity, unit, rate, amount) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [invoiceId, item.description, item.hsn_code, item.quantity, item.unit || 'Nos', item.rate, item.quantity * item.rate]
      );
    }

    logActivity(null, 'create_invoice', `Created invoice: ${invoiceNumber}`);
    res.json({ id: invoiceId, invoice_number: invoiceNumber, message: 'Invoice created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const {
      invoice_number,
      customer_id,
      invoice_date,
      due_date,
      items,
      status,
      cgst_rate,
      sgst_rate,
      igst_rate,
    } = req.body;

    // Simple status update
    if (status) {
      await db.runAsync('UPDATE invoices SET status = $1 WHERE id = $2', [status, req.params.id]);
      res.json({ message: 'Invoice status updated' });
      return;
    }

    // Scenario 94: Check status before modification
    const row = await db.getAsync('SELECT status FROM invoices WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    if (['paid', 'sent'].includes(row.status)) {
      return res.status(400).json({ error: 'Cannot update finalized invoice' });
    }

    let subtotal = items ? items.reduce((acc, item) => acc + item.quantity * item.rate, 0) : 0;
    const cRate = parseFloat(cgst_rate) || 0;
    const sRate = parseFloat(sgst_rate) || 0;
    const iRate = parseFloat(igst_rate) || 0;
    const cgstVal = (subtotal * cRate) / 100;
    const sgstVal = (subtotal * sRate) / 100;
    const igstVal = (subtotal * iRate) / 100;
    const total = subtotal + cgstVal + sgstVal + igstVal;

    await db.runAsync(
      `UPDATE invoices SET invoice_number = $1, customer_id = $2, invoice_date = $3, due_date = $4, subtotal = $5, cgst_rate = $6, sgst_rate = $7, igst_rate = $8, cgst_amount = $9, sgst_amount = $10, igst_amount = $11, total = $12 WHERE id = $13`,
      [invoice_number, customer_id, invoice_date, due_date, subtotal, cRate, sRate, iRate, cgstVal, sgstVal, igstVal, total, req.params.id]
    );

    // Delete old items and insert new ones
    await db.runAsync('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO invoice_items (invoice_id, description, hsn_code, quantity, rate, amount) VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.params.id, item.description, item.hsn_code, item.quantity, item.rate, item.quantity * item.rate]
      );
    }

    res.json({ message: 'Invoice updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const row = await db.getAsync('SELECT invoice_number FROM invoices WHERE id = $1', [req.params.id]);
    await db.runAsync('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    logActivity(null, 'delete_invoice', `Deleted invoice: ${row?.invoice_number}`);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const generatePdf = async (req, res) => {
  try {
    const invoice = await db.getAsync(
      `SELECT i.*, c.name as customer_name, c.email as customer_email, c.gstin as customer_gstin, 
              c.address as customer_address, c.city as customer_city, c.state as customer_state, 
              c.pincode as customer_pincode, c.phone as customer_phone 
       FROM invoices i 
       LEFT JOIN customers c ON i.customer_id = c.id 
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const items = await db.allAsync('SELECT * FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    const settingRows = await db.allAsync('SELECT * FROM settings');
    const settingsObj = {};
    if (settingRows) settingRows.forEach((r) => (settingsObj[r.key] = r.value));

    const data = {
      invoice: invoice,
      customer: {
        name: invoice.customer_name,
        email: invoice.customer_email,
        gstin: invoice.customer_gstin,
        address: invoice.customer_address,
        city: invoice.customer_city,
        state: invoice.customer_state,
        pincode: invoice.customer_pincode,
        phone: invoice.customer_phone,
      },
      items: items || [],
      settings: settingsObj,
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice.invoice_number}.pdf`);
    generateInvoice(data, (chunk) => res.write(chunk), () => res.end());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const sendEmail = async (req, res) => {
  try {
    const invoice = await db.getAsync(
      `SELECT i.*, c.name as customer_name, c.email as customer_email, c.gstin as customer_gstin, 
              c.address as customer_address, c.city as customer_city, c.state as customer_state, 
              c.pincode as customer_pincode 
       FROM invoices i 
       LEFT JOIN customers c ON i.customer_id = c.id 
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (!invoice.customer_email) return res.status(400).json({ error: 'Customer has no email address' });

    const { subject, body } = req.body || {};
    const items = await db.allAsync('SELECT * FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    const settingRows = await db.allAsync('SELECT * FROM settings');
    const settingsObj = {};
    if (settingRows) settingRows.forEach((r) => (settingsObj[r.key] = r.value));

    const data = {
      invoice: invoice,
      customer: {
        name: invoice.customer_name,
        email: invoice.customer_email,
        gstin: invoice.customer_gstin,
        address: invoice.customer_address,
        city: invoice.customer_city,
        state: invoice.customer_state,
        pincode: invoice.customer_pincode,
      },
      items: items || [],
      settings: settingsObj,
    };

    const chunks = [];
    generateInvoice(
      data,
      (chunk) => chunks.push(chunk),
      async () => {
        const pdfBuffer = Buffer.concat(chunks);
        const result = await sendInvoiceEmail(
          invoice.customer_email,
          invoice.invoice_number,
          pdfBuffer,
          subject,
          body
        );
        if (result.success) {
          await db.runAsync(
            "UPDATE invoices SET status = 'sent', sent_at = NOW() WHERE id = $1",
            [req.params.id]
          );
          logActivity(null, 'send_invoice', `Emailed invoice ${invoice.invoice_number}`);
          res.json({ success: true, message: 'Invoice sent successfully' });
        } else {
          res.status(500).json({
            error: 'Failed to send email. ' + (result.error || 'Check SMTP configuration.')
          });
        }
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const generateAutomated = async (req, res) => {
  try {
    const subscriptions = await db.allAsync(
      `SELECT s.*, u.name as user_name, u.email as user_email, p.price_discounted as amount, p.billing_cycle, p.name as plan_name 
       FROM subscriptions s 
       LEFT JOIN users u ON s.user_id = u.id 
       LEFT JOIN plans p ON s.plan_id = p.id 
       WHERE s.status = 'active'`
    );

    let createdCount = 0;
    const messages = [];
    const today = new Date();
    const todaysDate = today.toISOString().split('T')[0];
    const due = new Date(today);
    due.setDate(due.getDate() + 7);
    const dueDate = due.toISOString().split('T')[0];

    for (const sub of subscriptions) {
      // Check if already exists this month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const existing = await db.getAsync(
        "SELECT id FROM invoices WHERE subscription_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2",
        [sub.id, currentMonth]
      );
      if (existing) continue;

      // Get or create customer
      let customer = await db.getAsync('SELECT id FROM customers WHERE email = $1', [sub.user_email]);
      let customerId = customer?.id;

      if (!customerId) {
        const result = await db.runAsync(
          'INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING id',
          [sub.user_name, sub.user_email]
        );
        customerId = result.lastID;
      }

      if (!customerId) {
        messages.push(`Could not link customer for ${sub.user_email}`);
        continue;
      }

      const invoiceNumber = await getNextInvoiceNumber();
      const subtotal = sub.amount || 0;
      const taxable = subtotal;
      const cgst = taxable * 0.09;
      const sgst = taxable * 0.09;
      const total = taxable + cgst + sgst;

      const invResult = await db.runAsync(
        `INSERT INTO invoices (invoice_number, customer_id, user_id, subscription_id, invoice_date, due_date, subtotal, total, status, type, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', 'automated', $9) RETURNING id`,
        [
          invoiceNumber,
          customerId,
          sub.user_id,
          sub.id,
          todaysDate,
          dueDate,
          subtotal,
          total,
          `Auto-generated for Plan: ${sub.plan_name}`,
        ]
      );

      const invId = invResult.lastID;
      await db.runAsync(
        'INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount) VALUES ($1, $2, 1, $3, $4)',
        [invId, `Subscription Renewal: ${sub.plan_name}`, subtotal, subtotal]
      );

      createdCount++;
    }

    res.json({
      message: `Generated ${createdCount} automated invoices.`,
      created: createdCount,
      details: messages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getNextNumber,
  generatePdf,
  sendEmail,
  generateAutomated,
};
