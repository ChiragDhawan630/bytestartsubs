const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from root
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Export key vars or whole process.env wrapper
module.exports = {
  APP_ENV: process.env.APP_ENV || 'prod',
  PORT: process.env.PORT || 3000,
  SESSION_SECRET: process.env.SESSION_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASS: process.env.ADMIN_PASS,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  // ... add others as needed
  ...process.env
};
