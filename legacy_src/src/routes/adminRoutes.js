const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const customerController = require('../controllers/customerController');
const invoiceController = require('../controllers/invoiceController');
const { isAdmin } = require('../middleware/auth');

// Apply isAdmin middleware to all routes in this router
router.use(isAdmin);

console.log('Admin Routes Loaded'); // Debug: Confirm reload

// --- SMTP Test (Simplified Route) ---
router.post('/test-smtp', adminController.testSmtp);

// --- Stats ---
router.get('/check', (req, res) => res.json({ ok: true }));
router.get('/stats', adminController.getStats);
router.get('/activity', adminController.getActivityLogs);

// --- Users ---
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.post('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser); // New route

// --- Plans ---
router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

// --- Categories ---
router.get('/categories', adminController.getCategories);

router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// --- Razorpay ---
router.get('/razorpay/plans', adminController.getRazorpayPlans);
router.post('/razorpay/plans', adminController.createRazorpayPlan);

// --- Subscriptions ---
router.get('/subscriptions', adminController.getSubscriptions);
router.post('/subscriptions/sync', adminController.syncSubscriptions);
router.post('/subscriptions/:id/assign', adminController.assignSubscription);

// --- Errors ---
router.get('/errors', adminController.getErrorLogs);
router.get('/errors/count', adminController.getErrorCount);
router.post('/errors/:id/resolve', adminController.resolveError);
router.delete('/errors/:id', adminController.deleteError);
router.delete('/errors', adminController.clearErrors);

// --- Email Templates ---
router.get('/email-templates', adminController.getEmailTemplates);
router.get('/email-templates/:id', adminController.getEmailTemplate);
router.put('/email-templates/:id', adminController.updateEmailTemplate);

// --- Settings ---
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSettings);
router.get('/env', adminController.getEnvConfig);
router.post('/env', adminController.updateEnvConfig);

// --- Customers ---
router.get('/customers', customerController.getCustomers);
router.get('/customers/:id', customerController.getCustomer);
router.post('/customers', customerController.createCustomer);
router.put('/customers/:id', customerController.updateCustomer);
router.delete('/customers/:id', customerController.deleteCustomer);

// --- Invoices ---
router.get('/invoices', invoiceController.getInvoices);
router.get('/invoices/next-number', invoiceController.getNextNumber);
router.get('/invoices/:id', invoiceController.getInvoice);
router.post('/invoices', invoiceController.createInvoice);
router.put('/invoices/:id', invoiceController.updateInvoice);
router.delete('/invoices/:id', invoiceController.deleteInvoice);
router.get('/invoices/:id/pdf', invoiceController.generatePdf);
router.post('/invoices/:id/send', invoiceController.sendEmail);
router.post(
  '/invoices/generate-automated',
  invoiceController.generateAutomated
);

module.exports = router;
