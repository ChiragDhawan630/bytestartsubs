const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Public Categories
router.get('/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY display_order ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Public Plans
router.get('/plans', (req, res) => {
  db.all(
    'SELECT * FROM plans WHERE is_active = 1 ORDER BY display_order ASC',
    (err, rows) => {
      if (err) return res.status(500).send(err);
      if (rows.length === 0) return res.json({ useStatic: true });
      res.json({ useStatic: false, plans: rows });
    }
  );
});

// Policies
router.get('/policy/:type', (req, res) => {
  const type = req.params.type;
  const policyMap = {
    privacy: 'privacy_policy',
    terms: 'terms_policy',
    refund: 'refund_policy',
  };

  const settingKey = policyMap[type];
  if (!settingKey) {
    return res.status(404).send('Policy not found');
  }

  db.all('SELECT * FROM settings', (err, rows) => {
    if (err) return res.status(500).send('Error loading policy');
    const settings = {};
    rows.forEach((r) => (settings[r.key] = r.value));

    const policyContent =
      settings[settingKey] || '<p>Policy content not available.</p>';
    const companyName = settings.company_name || 'ByteStart Technologies';
    const logoUrl =
      settings.navbar_icon ||
      settings.logo_url ||
      'https://bytestarttechnologies.com/wp-content/uploads/2024/10/cropped-Circle-512x512-Logo-modified.png';

    const titleMap = {
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      refund: 'Refund Policy',
    };

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titleMap[type]} - ${companyName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .policy-content h1, .policy-content h2, .policy-content h3 { font-weight: 700; margin: 1.5rem 0 1rem; }
        .policy-content h1 { font-size: 2rem; }
        .policy-content h2 { font-size: 1.5rem; }
        .policy-content h3 { font-size: 1.25rem; }
        .policy-content p { margin-bottom: 1rem; line-height: 1.75; }
        .policy-content ul, .policy-content ol { margin-bottom: 1rem; padding-left: 1.5rem; }
        .policy-content li { margin-bottom: 0.5rem; }
        .policy-content a { color: #2563eb; text-decoration: underline; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <a href="/" class="flex items-center gap-3">
                <img src="${logoUrl}" alt="Logo" class="h-8 w-8 object-contain">
                <span class="font-bold text-lg text-gray-900">${companyName}</span>
            </a>
            <a href="/" class="text-blue-600 hover:underline text-sm font-medium">← Back to Home</a>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-12">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">${titleMap[type]}</h1>
            <p class="text-gray-500 text-sm mb-8">Last updated: ${settings[settingKey + '_updated'] || 'Not specified'}</p>
            <div class="policy-content text-gray-700">
                ${policyContent}
            </div>
        </div>
    </main>

    <footer class="bg-white border-t border-gray-200 mt-12 py-8">
        <div class="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            <div class="mt-4 space-x-4">
                <a href="/policy/privacy" class="hover:text-gray-900 ${type === 'privacy' ? 'font-bold text-gray-900' : ''}">Privacy Policy</a>
                <a href="/policy/terms" class="hover:text-gray-900 ${type === 'terms' ? 'font-bold text-gray-900' : ''}">Terms & Conditions</a>
                <a href="/policy/refund" class="hover:text-gray-900 ${type === 'refund' ? 'font-bold text-gray-900' : ''}">Refund Policy</a>
            </div>
        </div>
    </footer>
</body>
</html>`);
  });
});

module.exports = router;
