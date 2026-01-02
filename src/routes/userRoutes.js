const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

// Public or semi-protected (getUserProfile handles both)
router.get('/user', userController.getUserProfile); // /api/user

// Protected Routes
// router.use(isAuthenticated); // Removed global application to avoid trapping 404s

router.post('/user/update', isAuthenticated, userController.updateProfile);
router.post('/user/update-theme', isAuthenticated, userController.updateTheme);

router.get('/my-subscriptions', isAuthenticated, userController.getMySubscriptions);
router.post('/subscription/sync-my-subs', isAuthenticated, userController.syncMySubscriptions);

// Subscriptions & Payments
router.post('/subscription/create', isAuthenticated, userController.createSubscription);
router.post('/subscription/verify', isAuthenticated, userController.verifyPayment);
router.post('/subscription/resubscribe', isAuthenticated, userController.resubscribe);

module.exports = router;
