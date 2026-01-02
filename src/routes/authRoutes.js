const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');
const env = require('../config/env');

// Google Auth
// Google Auth
router.get('/auth/google', (req, res, next) => {
  if (env.APP_ENV === 'dev') {
    return res.redirect('/dev-login-popup'); // This route is likely in public routes or handled by specific dev route
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(
    req,
    res,
    next
  );
});

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  authController.googleCallback
);

// Dev Login
router.post('/auth/dev/login', authController.devLogin);

// Admin Login (Legacy)
router.post('/api/admin/login', loginLimiter, authController.adminLogin);

// Logout
router.get('/auth/logout', authController.logout);

module.exports = router;
