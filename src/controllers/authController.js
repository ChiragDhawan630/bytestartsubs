const passport = require('passport');
const env = require('../config/env');
const db = require('../config/database');
const { logActivity } = require('../utils/logger');

const devLogin = async (req, res) => {
  if (env.APP_ENV !== 'dev')
    return res.status(403).json({ error: 'Dev mode disabled' });
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const profile = {
      id: null,
      emails: [{ value: email }],
      displayName: email.split('@')[0],
      photos: null,
    };

    const googleId = profile.id;
    const name = profile.displayName;
    const avatar = null;

    let user = await db.getAsync('SELECT * FROM users WHERE email = $1', [email]);

    const loginUser = (user) => {
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: err });
        if (email === env.ADMIN_EMAIL) req.session.isAdmin = true;
        logActivity(user.id, 'login_dev', 'User logged in via Dev Mode');
        res.json({ success: true });
      });
    };

    if (user) {
      loginUser(user);
    } else {
      const result = await db.runAsync(
        'INSERT INTO users (google_id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id',
        [googleId, email, name, avatar]
      );
      const newId = result.lastID;
      logActivity(newId, 'register', 'New user registered via Dev');
      const newUser = await db.getAsync('SELECT * FROM users WHERE id = $1', [newId]);
      loginUser(newUser);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const adminLogin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (email === env.ADMIN_EMAIL && password === env.ADMIN_PASS) {
    req.session.isAdmin = true;
    logActivity(null, 'login_admin_legacy', 'Admin logged in with password');
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

const logout = (req, res, next) => {
  if (req.user) logActivity(req.user.id, 'logout', 'User logged out');
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy();
    res.redirect('/bytestart');
  });
};

const googleCallback = (req, res) => {
  if (req.user.email === env.ADMIN_EMAIL) {
    req.session.isAdmin = true;
    logActivity(req.user.id, 'login_admin', 'Admin logged in via Google');
    return res.redirect('/bytestart');
  }

  logActivity(req.user.id, 'login', 'User logged in via Google');
  res.redirect('/profile');
};

module.exports = { devLogin, adminLogin, logout, googleCallback };
