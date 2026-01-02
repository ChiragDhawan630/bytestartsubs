const db = require('../config/database');
const { logActivity } = require('../utils/logger');
const razorpayService = require('../services/razorpayService');
const env = require('../config/env');
const { sendSubscriptionEmail } = require('../services/emailService');
const crypto = require('crypto');

const getUserProfile = async (req, res) => {
  try {
    const row = await db.getAsync(
      'SELECT * FROM users WHERE id = $1',
      [req.user ? req.user.id : 0]
    );
    res.json({
      loggedIn: !!req.user,
      user: row || null,
      isAdmin: !!req.session.isAdmin,
      isDev: env.APP_ENV === 'dev',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { name, phone, alternate_phone, gstin, address, city, state, pincode } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const phoneRegex = /^\d+$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  try {
    // Update the users table
    await db.runAsync(
      'UPDATE users SET name = $1, phone = $2, alternate_phone = $3, gstin = $4, address = $5, city = $6, state = $7, pincode = $8 WHERE id = $9',
      [name, phone, alternate_phone, gstin, address, city, state, pincode, req.user.id]
    );

    // Also sync to customers table if a customer exists with same email
    const user = await db.getAsync('SELECT email FROM users WHERE id = $1', [req.user.id]);
    if (user && user.email) {
      try {
        await db.runAsync(
          'UPDATE customers SET name = $1, phone = $2, gstin = $3, address = $4, city = $5, state = $6, pincode = $7 WHERE email = $8',
          [name, phone, gstin, address, city, state, pincode, user.email]
        );
      } catch (syncErr) {
        console.error('Customer sync error:', syncErr);
      }
    }

    logActivity(req.user.id, 'profile_update', 'Updated profile');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTheme = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { theme } = req.body;
  if (!['light', 'dark'].includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme' });
  }
  try {
    await db.runAsync('UPDATE users SET theme = $1 WHERE id = $2', [theme, req.user.id]);
    res.json({ success: true, theme });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMySubscriptions = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const rows = await db.allAsync(
      `SELECT s.*, p.name as plan_name, p.billing_cycle 
       FROM subscriptions s 
       LEFT JOIN plans p ON (s.plan_id = p.id OR s.plan_id = p.razorpay_plan_id)
       WHERE s.user_id = $1 
       ORDER BY s.start_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const syncMySubscriptions = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const localSubs = await db.allAsync(
      'SELECT razorpay_sub_id FROM subscriptions WHERE user_id = $1',
      [req.user.id]
    );

    let updated = 0;
    for (const sub of localSubs) {
      try {
        const rzSub = await razorpayService.fetchSubscription(sub.razorpay_sub_id);
        if (rzSub) {
          const renewalDate = rzSub.current_end ? new Date(rzSub.current_end * 1000).toISOString() : null;
          await db.runAsync(
            'UPDATE subscriptions SET status = $1, renewal_date = $2 WHERE razorpay_sub_id = $3',
            [rzSub.status, renewalDate, sub.razorpay_sub_id]
          );
          updated++;
        }
      } catch (e) {
        console.warn(`Failed to sync sub ${sub.razorpay_sub_id}`, e.message);
      }
    }

    res.json({ success: true, message: `Synced ${updated} subscriptions` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const createSubscription = async (req, res) => {
  if (!req.user)
    return res.status(401).json({ error: 'Please login first', requireLogin: true });

  try {
    const { plan_type } = req.body;
    if (!plan_type) return res.status(400).json({ error: 'No plan selected.' });

    // Get Plan ID from database
    const plan = await db.getAsync(
      'SELECT razorpay_plan_id, is_active FROM plans WHERE id = $1',
      [plan_type]
    );

    let planId = null;
    if (plan) {
      if (plan.is_active === false) {
        return res.status(400).json({ error: 'Plan not found or inactive.' });
      }
      planId = plan.razorpay_plan_id || env[`PLAN_ID_${plan_type.toUpperCase().replace('-', '_')}`];
    } else {
      const envKey = `PLAN_ID_${plan_type.toUpperCase().replace('-', '_')}`;
      planId = env[envKey];
    }

    if (!planId || !planId.startsWith('plan_')) {
      return res.status(400).json({ error: 'Plan not found or inactive.' });
    }

    const instance = razorpayService.getInstance();
    const subscription = await instance.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: String(req.user.id),
        user_email: req.user.email,
        plan_name: plan_type,
      },
    });

    await db.runAsync(
      'INSERT INTO subscriptions (user_id, razorpay_sub_id, plan_id, status) VALUES ($1, $2, $3, $4)',
      [req.user.id, subscription.id, plan_type, 'created']
    );

    logActivity(req.user.id, 'create_subscription_init', `Initiated ${plan_type}`);

    res.json({
      subscription_id: subscription.id,
      key_id: env.RAZORPAY_KEY_ID,
      user_email: req.user.email,
      user_phone: req.user.phone || '',
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature, plan_type } = req.body;

  if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required payment parameters' });
  }

  // Signature Verification
  const text = razorpay_payment_id + '|' + razorpay_subscription_id;
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  try {
    const row = await db.getAsync(
      'SELECT status FROM subscriptions WHERE razorpay_sub_id = $1',
      [razorpay_subscription_id]
    );

    if (!row) return res.status(404).json({ error: 'Subscription not found' });
    if (row.status === 'active') {
      return res.status(200).json({ status: 'success', message: 'Already active' });
    }

    await db.runAsync(
      "UPDATE subscriptions SET status = 'active' WHERE razorpay_sub_id = $1",
      [razorpay_subscription_id]
    );

    if (req.user) {
      try {
        Promise.resolve(sendSubscriptionEmail(
          req.user.email,
          req.user.name,
          plan_type,
          razorpay_subscription_id
        )).catch(err => console.error('Email send failed:', err.message));
      } catch (e) {
        console.error('Email sync error:', e.message);
      }
    }

    logActivity(
      req.user ? req.user.id : null,
      'subscription_verified',
      `Verified ${plan_type}`
    );
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resubscribe = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { subscription_id } = req.body;
  if (!subscription_id)
    return res.status(400).json({ error: 'Subscription ID required' });

  try {
    const instance = razorpayService.getInstance();
    let oldSub;
    try {
      oldSub = await instance.subscriptions.fetch(subscription_id);
    } catch (e) {
      if (e.statusCode === 400 || (e.error && e.error.code === 'BAD_REQUEST_ERROR')) {
        throw new Error('Subscription not found');
      }
      throw e;
    }

    if (!oldSub)
      return res.status(404).json({ error: 'Subscription not found' });

    // Foreign User Check
    if (oldSub.notes && oldSub.notes.user_id && String(oldSub.notes.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden: You cannot resubscribe to this subscription.' });
    }

    const currentEnd = oldSub.current_end
      ? new Date(oldSub.current_end * 1000)
      : new Date();
    const now = new Date();
    const startAt = currentEnd > now ? currentEnd : null;

    const options = {
      plan_id: oldSub.plan_id,
      total_count: oldSub.total_count,
      quantity: oldSub.quantity,
      customer_notify: 1,
      notes: { ...oldSub.notes, resubscribed_from: subscription_id },
    };

    if (startAt) options.start_at = Math.floor(startAt.getTime() / 1000);

    const newSub = await instance.subscriptions.create(options);

    // Insert into DB
    const renewalDate = newSub.current_end ? new Date(newSub.current_end * 1000).toISOString() : null;
    await db.runAsync(
      'INSERT INTO subscriptions (razorpay_sub_id, plan_id, status, start_date, renewal_date, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        newSub.id,
        newSub.plan_id,
        newSub.status,
        new Date().toISOString(),
        renewalDate,
        req.user.id,
      ]
    );

    res.json({
      success: true,
      subscription_id: newSub.id,
      order_id: newSub.id,
      key_id: env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    if (error.message === 'Subscription not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Resubscribe Error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  updateTheme,
  getMySubscriptions,
  syncMySubscriptions,
  createSubscription,
  verifyPayment,
  resubscribe,
};
