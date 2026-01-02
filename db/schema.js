/**
 * Centralized Schema Definitions - PostgreSQL
 * All table creation statements in one place
 */

const TABLES = {
    // Schema version tracking
    schema_version: `
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT NOW(),
            description TEXT
        )
    `,

    // Email Templates
    email_templates: `
        CREATE TABLE IF NOT EXISTS email_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            subject TEXT,
            body TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `,

    // Users
    users: `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            google_id TEXT UNIQUE,
            email TEXT UNIQUE,
            name TEXT,
            phone TEXT,
            alternate_phone TEXT,
            avatar_url TEXT,
            gstin TEXT,
            theme TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            pincode TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `,

    // Subscriptions
    subscriptions: `
        CREATE TABLE IF NOT EXISTS subscriptions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            razorpay_sub_id TEXT,
            plan_id TEXT,
            status TEXT DEFAULT 'created',
            start_date TIMESTAMP DEFAULT NOW(),
            renewal_date TIMESTAMP
        )
    `,

    // Activity Logs
    activity_logs: `
        CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            action TEXT,
            details TEXT,
            timestamp TIMESTAMP DEFAULT NOW()
        )
    `,

    // Error Logs
    error_logs: `
        CREATE TABLE IF NOT EXISTS error_logs (
            id SERIAL PRIMARY KEY,
            error_type TEXT,
            message TEXT,
            stack TEXT,
            context TEXT,
            resolved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `,

    // Categories
    categories: `
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT,
            icon TEXT,
            tagline TEXT,
            display_order INTEGER DEFAULT 0
        )
    `,

    // Settings
    settings: `
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `,

    // Plans
    plans: `
        CREATE TABLE IF NOT EXISTS plans (
            id TEXT PRIMARY KEY,
            name TEXT,
            price_original INTEGER,
            price_discounted INTEGER,
            billing_cycle TEXT,
            features TEXT,
            razorpay_plan_id TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            display_order INTEGER,
            category TEXT DEFAULT 'ecommerce',
            price_color TEXT
        )
    `,

    // Customers
    customers: `
        CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            gstin TEXT,
            pan TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            state_code TEXT,
            pincode TEXT,
            country TEXT DEFAULT 'India',
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `,

    // Invoices
    invoices: `
        CREATE TABLE IF NOT EXISTS invoices (
            id SERIAL PRIMARY KEY,
            invoice_number TEXT UNIQUE NOT NULL,
            type TEXT DEFAULT 'manual',
            customer_id INTEGER REFERENCES customers(id),
            user_id INTEGER REFERENCES users(id),
            subscription_id INTEGER REFERENCES subscriptions(id),
            invoice_date DATE DEFAULT CURRENT_DATE,
            due_date DATE,
            place_of_supply TEXT,
            subtotal NUMERIC(10,2) DEFAULT 0,
            discount_percent NUMERIC(5,2) DEFAULT 0,
            discount_amount NUMERIC(10,2) DEFAULT 0,
            taxable_amount NUMERIC(10,2) DEFAULT 0,
            cgst_rate NUMERIC(5,2) DEFAULT 9,
            sgst_rate NUMERIC(5,2) DEFAULT 9,
            igst_rate NUMERIC(5,2) DEFAULT 0,
            cgst_amount NUMERIC(10,2) DEFAULT 0,
            sgst_amount NUMERIC(10,2) DEFAULT 0,
            igst_amount NUMERIC(10,2) DEFAULT 0,
            total NUMERIC(10,2) DEFAULT 0,
            amount_paid NUMERIC(10,2) DEFAULT 0,
            balance_due NUMERIC(10,2) DEFAULT 0,
            status TEXT DEFAULT 'draft',
            payment_terms TEXT,
            notes TEXT,
            terms_conditions TEXT,
            pdf_generated BOOLEAN DEFAULT FALSE,
            sent_at TIMESTAMP,
            paid_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `,

    // Invoice Items
    invoice_items: `
        CREATE TABLE IF NOT EXISTS invoice_items (
            id SERIAL PRIMARY KEY,
            invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            hsn_code TEXT,
            quantity NUMERIC(10,2) DEFAULT 1,
            unit TEXT DEFAULT 'Nos',
            rate NUMERIC(10,2) NOT NULL,
            amount NUMERIC(10,2) NOT NULL
        )
    `
};

// Default seed data
const SEEDS = {
    settings: {
        company_name: 'ByteStart Technologies',
        company_tagline: 'Your Digital Partner',
        logo_url: 'https://bytestarttechnologies.com/wp-content/uploads/2024/10/cropped-Circle-512x512-Logo-modified.png',
        navbar_icon: 'https://bytestarttechnologies.com/wp-content/uploads/2024/10/cropped-Circle-512x512-Logo-modified.png',
        favicon_url: 'https://bytestarttechnologies.com/wp-content/uploads/2024/10/cropped-Circle-512x512-Logo-modified.png',
        footer_text: '© 2025 ByteStart Technologies. All rights reserved.',
        company_phone: '+918076354446',
        support_phone: '918076354446',
        company_email: 'info@bytestarttechnologies.com',
        support_email: 'info@bytestarttechnologies.com',
        company_address: '',
        company_gstin: '',
        company_pan: '',
        company_bank_name: '',
        company_bank_account: '',
        company_bank_ifsc: '',
        company_bank_branch: '',
        company_upi_id: '',
        company_state_code: '09',
        invoice_prefix: 'INV',
        invoice_terms: 'Payment is due within 30 days of invoice date.',
        invoice_due_days: '30',
        invoice_currency: '₹',
        default_gst_rate: '18',
        default_cgst_rate: '9',
        default_sgst_rate: '9',
        default_igst_rate: '18',
        privacy_policy: '<h2>Privacy Policy</h2><p>At ByteStart, we value your privacy.</p>',
        terms_policy: '<h2>Terms & Conditions</h2><p>By using our services, you agree to our terms.</p>',
        refund_policy: '<h2>Refund Policy</h2><p>Refunds are processed on a pro-rata basis for annual plans.</p>',
        whitelist_domains: '',
        sale_banner_text: '🔥 ByteStart Services Sale - Limited Time Offer!',
        homepage_title: 'Plans for **Growth & Scale** 📈',
        homepage_subtitle: 'Choose the perfect package to elevate your digital presence.',
        disclaimer_text: 'Disclaimer: All websites are subscription based only. Prices and plans are subject to change.'
    },

    categories: [
        { id: 'ecommerce', name: 'E-Commerce Plans', display_order: 1, icon: '🛒', tagline: 'Start your own online store today 🚀' },
        { id: 'website', name: 'Website-Only Plans', display_order: 2, icon: '⚡', tagline: 'Clean. Fast. Money-efficient 💸' }
    ],

    email_templates: [
        {
            id: 'invoice',
            name: 'Invoice',
            subject: 'Invoice {{invoice_number}} from ByteStart Technologies',
            body: `Hello {{customer_name}},\n\nPlease find attached invoice {{invoice_number}} for your recent services.\n\nThe total amount of {{total}} is due by {{due_date}}.\n\nThank you for your business!\n\nByteStart Technologies Team`
        },
        {
            id: 'subscription_confirm',
            name: 'Subscription Confirmation',
            subject: 'Subscription Confirmed - ByteStart Technologies',
            body: `Hello {{customer_name}},\n\nYour subscription has been successfully confirmed. Thank you for choosing ByteStart Technologies!\n\nYou can manage your subscription from your dashboard.`
        }
    ]
};

// Current schema version
const CURRENT_VERSION = 6; // Incremented for price_color column

module.exports = {
    TABLES,
    SEEDS,
    CURRENT_VERSION,
    TABLE_NAMES: Object.keys(TABLES)
};
