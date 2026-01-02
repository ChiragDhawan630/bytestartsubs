const db = require('../config/database');
const { logActivity } = require('../utils/logger');
const razorpayService = require('../services/razorpayService');
const envHelper = require('../utils/envHelper');
const env = require('../config/env');
const emailService = require('../services/emailService');
const syncService = require('../services/syncService');

// --- Stats ---
const getStats = async (req, res) => {
  try {
    const stats = {};
    const usersResult = await db.getAsync('SELECT COUNT(*) as count FROM users');
    stats.totalUsers = usersResult ? parseInt(usersResult.count) : 0;

    const subsResult = await db.getAsync(
      "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'"
    );
    stats.activeSubs = subsResult ? parseInt(subsResult.count) : 0;
    stats.revenue = stats.activeSubs * 1000;

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Users ---
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (Math.max(1, pageNum) - 1) * limitNum;
    const searchTerm = `%${search}%`;

    const rows = await db.allAsync(
      `SELECT users.*, 
              (SELECT COUNT(*) FROM subscriptions WHERE user_id = users.id AND status='active') as active_subs_count,
              (SELECT STRING_AGG(plan_id, ', ') FROM subscriptions WHERE user_id = users.id AND status='active') as active_plans 
              FROM users 
              WHERE name ILIKE $1 OR email ILIKE $2
              ORDER BY created_at DESC 
              LIMIT $3 OFFSET $4`,
      [searchTerm, searchTerm, limitNum, offset]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Scenario 50: Check for active subscriptions before delete
    const row = await db.getAsync(
      "SELECT COUNT(*) as count FROM subscriptions WHERE user_id = $1 AND status = 'active'",
      [req.params.id]
    );
    if (row && parseInt(row.count) > 0) {
      return res.status(400).json({ error: 'Cannot delete user with active subscriptions' });
    }

    const result = await db.runAsync('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, phone, gstin, email, address, city, state, pincode } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (email) {
      // Check for duplicate email
      const existing = await db.getAsync(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.params.id]
      );
      if (existing) return res.status(400).json({ error: 'Email already in use' });

      // Update with email
      const result = await db.runAsync(
        'UPDATE users SET name = $1, phone = $2, gstin = $3, email = $4, address = $5, city = $6, state = $7, pincode = $8 WHERE id = $9',
        [name, phone, gstin, email, address, city, state, pincode, req.params.id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    } else {
      // Update without email
      const result = await db.runAsync(
        'UPDATE users SET name = $1, phone = $2, gstin = $3, address = $4, city = $5, state = $6, pincode = $7 WHERE id = $8',
        [name, phone, gstin, address, city, state, pincode, req.params.id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    }

    logActivity(
      req.session.userId || 0,
      'admin_user_update',
      `Admin updated user ID ${req.params.id}`
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create user from Admin Panel
const createUser = async (req, res) => {
  try {
    const { name, email, phone, gstin, address, city, state, pincode } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists
    const existing = await db.getAsync('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(400).json({ error: 'A user with this email already exists' });

    // Insert new user
    const result = await db.runAsync(
      `INSERT INTO users (name, email, phone, gstin, address, city, state, pincode, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id`,
      [name, email, phone || null, gstin || null, address || null, city || null, state || null, pincode || null]
    );

    logActivity(
      req.session.userId || 0,
      'admin_user_create',
      `Admin created user: ${email}`
    );
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Categories ---
const getCategories = async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT * FROM categories ORDER BY display_order ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { id, name, icon, tagline, display_order } = req.body;
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, tagline, display_order) VALUES ($1, $2, $3, $4, $5)',
      [id, name, icon, tagline, display_order]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, icon, tagline, display_order } = req.body;
    const result = await db.runAsync(
      'UPDATE categories SET name=$1, icon=$2, tagline=$3, display_order=$4 WHERE id=$5',
      [name, icon, tagline, display_order, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    // Scenario 59: Check dependency
    const row = await db.getAsync('SELECT COUNT(*) as count FROM plans WHERE category = $1', [req.params.id]);
    if (row && parseInt(row.count) > 0) {
      return res.status(400).json({ error: 'Cannot delete category with linked plans' });
    }

    const result = await db.runAsync('DELETE FROM categories WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Plans ---
const getPlans = async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT * FROM plans ORDER BY display_order ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPlan = async (req, res) => {
  try {
    const {
      id,
      name,
      price_original,
      price_discounted,
      billing_cycle,
      features,
      razorpay_plan_id,
      category,
      display_order,
      price_color,
      is_active,
    } = req.body;

    // Scenario 61: Negative Price Check
    if (price_original < 0 || price_discounted < 0) {
      return res.status(400).json({ error: 'Price cannot be negative' });
    }

    // Scenario 60: JSON Features Check
    if (features && !Array.isArray(features)) {
      return res.status(400).json({ error: 'Features must be an array' });
    }

    const safeFeatures = features ? JSON.stringify(features) : '[]';
    const safeColor = price_color || '#000000';
    // Default is_active to true if not provided, but respect false if explicitly sent
    let safeIsActive = true;
    if (is_active !== undefined) {
      safeIsActive = (is_active === true || is_active === 'true' || is_active === 1 || is_active === '1');
    }

    await db.runAsync(
      `INSERT INTO plans (id, name, price_original, price_discounted, billing_cycle, features, razorpay_plan_id, display_order, category, price_color, is_active)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        name,
        price_original,
        price_discounted,
        billing_cycle,
        safeFeatures,
        razorpay_plan_id,
        display_order,
        category,
        safeColor,
        safeIsActive,
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const {
      name,
      price_original,
      price_discounted,
      features,
      razorpay_plan_id,
      is_active,
      category,
      display_order,
      billing_cycle,
      price_color,
    } = req.body;
    const safeFeatures = features ? JSON.stringify(features) : '[]';
    const safeColor = price_color || '#000000';

    const result = await db.runAsync(
      `UPDATE plans SET name=$1, price_original=$2, price_discounted=$3, features=$4, razorpay_plan_id=$5, is_active=$6, category=$7, display_order=$8, billing_cycle=$9, price_color=$10 WHERE id=$11`,
      [
        name,
        price_original,
        price_discounted,
        safeFeatures,
        razorpay_plan_id,
        (is_active === true || is_active === 'true' || is_active === 1 || is_active === '1'),
        category,
        display_order,
        billing_cycle,
        safeColor,
        req.params.id,
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Plan not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    // Scenario 63: Active Subs Linked
    const row = await db.getAsync(
      "SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = $1 AND status = 'active'",
      [req.params.id]
    );
    if (row && parseInt(row.count) > 0) {
      return res.status(400).json({ error: 'Cannot delete plan with active subscriptions' });
    }

    const result = await db.runAsync('DELETE FROM plans WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Plan not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Razorpay Plans ---
const createRazorpayPlan = async (req, res) => {
  try {
    const plan = await razorpayService.createPlan(req.body);
    res.json(plan);
  } catch (error) {
    console.error('Razorpay Plan Create Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getRazorpayPlans = async (req, res) => {
  try {
    const result = await razorpayService.fetchPlans();
    res.json({
      connected: true,
      plans: result.items || [],
    });
  } catch (error) {
    res.json({
      connected: false,
      error: error.message || 'Failed to fetch plans',
      plans: [],
    });
  }
};

// --- Subscriptions ---
const getSubscriptions = async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT s.*, u.name as user_name, u.email as user_email, 
              MAX(p.price_discounted) as amount, 
              MAX(p.billing_cycle) as billing_cycle, 
              MAX(p.name) as plan_name 
              FROM subscriptions s 
              LEFT JOIN users u ON s.user_id = u.id 
              LEFT JOIN plans p ON (s.plan_id = p.id OR s.plan_id = p.razorpay_plan_id)
              GROUP BY s.id, u.name, u.email
              ORDER BY s.start_date DESC`
    );
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const syncSubscriptions = async (req, res) => {
  try {
    const stats = await syncService.syncSubscriptions();
    res.json({ success: true, ...stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignSubscription = async (req, res) => {
  try {
    const { email } = req.body;
    const subId = req.params.id;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await db.getAsync('SELECT id FROM users WHERE email = $1', [email]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await db.runAsync('UPDATE subscriptions SET user_id = $1 WHERE id = $2', [user.id, subId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Logs ---
const getActivityLogs = async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT a.*, u.name as user_name 
              FROM activity_logs a 
              LEFT JOIN users u ON a.user_id = u.id 
              ORDER BY a.timestamp DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getErrorLogs = async (req, res) => {
  try {
    const rows = await db.allAsync(
      'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 200'
    );
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getErrorCount = async (req, res) => {
  try {
    const row = await db.getAsync(
      'SELECT COUNT(*) as count FROM error_logs WHERE resolved = FALSE'
    );
    res.json({ count: row ? parseInt(row.count) : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resolveError = async (req, res) => {
  try {
    await db.runAsync('UPDATE error_logs SET resolved = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteError = async (req, res) => {
  try {
    await db.runAsync('DELETE FROM error_logs WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const clearErrors = async (req, res) => {
  try {
    await db.runAsync('DELETE FROM error_logs');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Settings ---
const getSettings = async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT * FROM settings');
    const settings = {};
    if (rows) rows.forEach((r) => (settings[r.key] = r.value));
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSettings = async (req, res) => {
  const settings = req.body;

  // Validation patterns for optional fields
  const validations = {
    company_gstin: {
      pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      message: 'Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5'
    },
    company_pan: {
      pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      message: 'Invalid PAN format. Expected format: AAAAA0000A'
    },
    company_bank_ifsc: {
      pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
      message: 'Invalid IFSC format. Expected format: HDFC0001234'
    },
    company_state_code: {
      pattern: /^[0-9]{1,2}$/,
      message: 'State code must be 1-2 digits'
    },
    default_cgst_rate: {
      pattern: /^[0-9]{1,2}(\.[0-9]{1,2})?$/,
      message: 'CGST rate must be a valid number between 0-50'
    },
    default_sgst_rate: {
      pattern: /^[0-9]{1,2}(\.[0-9]{1,2})?$/,
      message: 'SGST rate must be a valid number between 0-50'
    },
    default_igst_rate: {
      pattern: /^[0-9]{1,2}(\.[0-9]{1,2})?$/,
      message: 'IGST rate must be a valid number between 0-50'
    },
    invoice_due_days: {
      pattern: /^[0-9]{1,3}$/,
      message: 'Due days must be a number between 0-365'
    }
  };

  // Validate fields that have values
  for (const [key, rule] of Object.entries(validations)) {
    const value = settings[key];
    if (value !== undefined && value !== null && value !== '') {
      const testValue = String(value).toUpperCase().trim();
      if (!rule.pattern.test(testValue)) {
        return res.status(400).json({ error: rule.message });
      }
      if (['company_gstin', 'company_pan', 'company_bank_ifsc'].includes(key)) {
        settings[key] = testValue;
      }
    }
  }

  // Validate numeric ranges
  if (settings.default_cgst_rate && (parseFloat(settings.default_cgst_rate) < 0 || parseFloat(settings.default_cgst_rate) > 50)) {
    return res.status(400).json({ error: 'CGST rate must be between 0 and 50' });
  }
  if (settings.default_sgst_rate && (parseFloat(settings.default_sgst_rate) < 0 || parseFloat(settings.default_sgst_rate) > 50)) {
    return res.status(400).json({ error: 'SGST rate must be between 0 and 50' });
  }
  if (settings.default_igst_rate && (parseFloat(settings.default_igst_rate) < 0 || parseFloat(settings.default_igst_rate) > 50)) {
    return res.status(400).json({ error: 'IGST rate must be between 0 and 50' });
  }
  if (settings.invoice_due_days && (parseInt(settings.invoice_due_days) < 0 || parseInt(settings.invoice_due_days) > 365)) {
    return res.status(400).json({ error: 'Due days must be between 0 and 365' });
  }

  try {
    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const policyKeys = ['privacy_policy', 'terms_policy', 'refund_policy'];

    policyKeys.forEach((key) => {
      if (settings[key] !== undefined) settings[key + '_updated'] = today;
    });

    // Use PostgreSQL upsert
    for (const [key, value] of Object.entries(settings)) {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, value]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getEnvConfig = (req, res) => {
  const allowedKeys = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
  ];
  const config = {};
  allowedKeys.forEach((key) => (config[key] = process.env[key] || ''));
  res.json(config);
};

const updateEnvConfig = async (req, res) => {
  const allowedKeys = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
  ];
  const updates = {};
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  try {
    await envHelper.updateEnvFileAsync(updates);

    // Hot-reload process.env
    for (const [key, value] of Object.entries(updates)) {
      process.env[key] = value;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const testSmtp = async (req, res) => {
  try {
    let recipient = (req.body && req.body.recipient) ? req.body.recipient : null;
    if (!recipient) {
      const user = req.user;
      recipient = (user && user.email) ? user.email : 'admin@example.com';
    }
    console.log('[SMTP Test] Recipient:', recipient);

    await emailService.testConnection();
    await emailService.sendTestEmail(recipient);

    res.json({ success: true, recipient });
  } catch (error) {
    console.error("SMTP Test Failed:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

const getEmailTemplates = async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT * FROM email_templates ORDER BY name ASC');
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getEmailTemplate = async (req, res) => {
  try {
    const row = await db.getAsync('SELECT * FROM email_templates WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Template not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateEmailTemplate = async (req, res) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    const result = await db.runAsync(
      'UPDATE email_templates SET subject = $1, body = $2 WHERE id = $3',
      [subject, body, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Template not found' });

    logActivity(null, 'update_email_template', `Updated email template: ${req.params.id}`);
    res.json({ success: true, message: 'Template updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  createRazorpayPlan,
  getRazorpayPlans,
  getSubscriptions,
  syncSubscriptions,
  assignSubscription,
  getActivityLogs,
  getErrorLogs,
  getErrorCount,
  resolveError,
  deleteError,
  clearErrors,
  getSettings,
  updateSettings,
  getEnvConfig,
  updateEnvConfig,
  testSmtp,
  getEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
};
