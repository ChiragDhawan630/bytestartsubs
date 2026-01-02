const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const env = require('./config/env');
require('./config/passport'); // Initialize passport config

// Route Imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { logError } = require('./utils/logger');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, '../'))); // Serve root?
// Original server.js served root static files.
// We should probably allow static serving but maybe restrict it?
// Assuming frontend assets are in root for now.
app.use(express.static(path.resolve(__dirname, '../')));

// Disable Cache in Dev Mode
app.use((req, res, next) => {
  if (env.APP_ENV === 'dev') {
    res.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
  }
  next();
});

// Session
app.use(
  session({
    secret: env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using https (env.NODE_ENV === 'production'?)
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Debug Logging (Optional)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[REQ] ${req.method} ${req.path}`);
  }
  next();
});

// --- Routes ---

// View Routes (Legacy Static HTML serving) - Matches server.js behavior
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../index.html'));
});

app.get('/profile', (req, res) => {
  if (!req.user) return res.redirect('/');
  res.sendFile(path.resolve(__dirname, '../profile.html'));
});

app.get('/bytestart', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../admin.html'));
});

app.get('/dev-login-popup', (req, res) => {
  if (env.APP_ENV !== 'dev') return res.status(404).send('Not Found');
  // Using simple HTML string for dev popup
  res.send(`
        <!DOCTYPE html><html><head><title>Dev Login</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-100 flex items-center justify-center h-screen"><div class="bg-white p-8 rounded shadow-lg"><h2 class="text-xl font-bold mb-4">🚧 Dev Mode Login</h2><form onsubmit="event.preventDefault(); login();"><input type="email" id="email" placeholder="Enter email" class="border p-2 w-full mb-4" required><div id="msg" class="text-red-500 text-sm mb-2 hidden"></div><button id="btn" class="bg-blue-600 text-white px-4 py-2 rounded w-full">Login</button></form><script>async function login() {const email = document.getElementById('email').value;const btn = document.getElementById('btn');const msg = document.getElementById('msg');btn.innerText = 'Logging in...';btn.disabled = true;msg.classList.add('hidden');try {const res = await fetch('/auth/dev/login', {method: 'POST',headers: {'Content-Type': 'application/json'},body: JSON.stringify({ email })});if(res.ok) {btn.innerText = 'Success!';setTimeout(() => {if(window.opener) {window.opener.location.reload(); window.close();} else {window.location.href = '/profile';}}, 800);} else {throw new Error('Login failed');}} catch(e) {btn.innerText = 'Login';btn.disabled = false;msg.innerText = e.message;msg.classList.remove('hidden');}}</script></div></body></html>
    `);
});

// API Routes
app.use('/', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes); // Public endpoints like /api/plans
// User routes often are mix of /api/user/* and /api/subscription/*
// We need to be careful mounting.
// userRoutes handles /user, /my-subscriptions, /create-subscription
// If we mount at /api, we get /api/user, /api/my-subscriptions.
app.use('/api', userRoutes);

// 404 Handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);

  // Log to DB
  logError(err, {
    path: req.path,
    method: req.method,
    // body: req.body, // Be careful logging body with PII/passwords. Maybe omit for now or sanitize.
    user_id: req.user ? req.user.id : null
  }, 'system');

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
