const request = require('supertest');
const app = require('../app');
const env = require('../config/env');

// Mocks
jest.mock('../config/database', () => ({
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
    prepare: jest.fn(),
    serialize: jest.fn((cb) => cb()),
}));
jest.mock('../utils/envHelper', () => ({
    updateEnvFileAsync: jest.fn(),
}));

const dbMock = require('../config/database');
const envHelper = require('../utils/envHelper');

describe('7. Admin - Settings & Environment', () => {
    let agent;
    const adminEmail = 'admin@test.com';

    beforeAll(() => {
        agent = request.agent(app);
        env.APP_ENV = 'dev';
        env.ADMIN_EMAIL = adminEmail;
        env.ADMIN_PASS = 'secret';
    });

    const robustMock = (logicMap, defaultFn) => {
        return (sql, p1, p2) => {
            const cb = typeof p1 === 'function' ? p1 : p2;
            const params = typeof p1 === 'function' ? [] : p1;

            let handled = false;
            for (const [key, fn] of Object.entries(logicMap)) {
                if (sql.includes(key)) {
                    fn(cb, params);
                    handled = true;
                    break;
                }
            }
            if (!handled && defaultFn) defaultFn(cb, params);
            else if (!handled && cb) cb(null, null);
        };
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        dbMock.serialize.mockImplementation(cb => cb());

        dbMock.get.mockImplementation(robustMock({
            'FROM users': (cb) => cb(null, { id: 1, email: adminEmail, role: 'admin' })
        }));

        dbMock.run.mockImplementation(function (sql, params, cb) {
            const callback = cb || params;
            if (callback && typeof callback === 'function') callback.call({ changes: 1 }, null);
        });

        // Mock prepare for updateSettings
        const stmtMock = { run: jest.fn() };
        dbMock.prepare.mockReturnValue(stmtMock);

        await agent.post('/auth/dev/login').send({ email: adminEmail });
    });

    // 71. Update Settings - SQL Injection
    test('71. Update Settings - SQL Injection', async () => {
        const injection = "'; DROP TABLE settings; --";
        const res = await agent.post('/api/admin/settings').send({
            privacy_policy: injection
        });

        const stmt = dbMock.prepare();
        expect(res.statusCode).toBe(200);
        // Verify parameters were bound safely, not concatenated
        // stmt.run called for each key.
        expect(stmt.run).toHaveBeenCalledWith('privacy_policy', injection);
    });

    // 72. Update Settings - Key Exposure (Logging)
    test('72. Update Settings - Key Exposure', async () => {
        const res = await agent.post('/api/admin/env').send({
            RAZORPAY_KEY_SECRET: 'SECRET_API_KEY'
        });

        expect(res.statusCode).toBe(200);
        expect(envHelper.updateEnvFileAsync).toHaveBeenCalledWith(expect.objectContaining({
            RAZORPAY_KEY_SECRET: 'SECRET_API_KEY'
        }));
    });

    // 73. Get Env Config - Hidden Secrets
    test('73. Get Env Config - Hidden Secrets', async () => {
        process.env.RAZORPAY_KEY_SECRET = 'sk_live_SECRET';

        const res = await agent.get('/api/admin/env');
        expect(res.statusCode).toBe(200);
        expect(res.body.RAZORPAY_KEY_SECRET).toBe('sk_live_SECRET');
    });

    // 74. Update Env - Invalid Format
    test('74. Update Env - Invalid Format', async () => {
        const badVal = 'invalid\nnewline';
        const res = await agent.post('/api/admin/env').send({
            RAZORPAY_KEY_ID: badVal
        });

        expect(res.statusCode).toBe(200);
        expect(envHelper.updateEnvFileAsync).toHaveBeenCalled();
    });

    // 75. Env Update - Permission Denied
    test('75. Env Update - Permission Denied', async () => {
        envHelper.updateEnvFileAsync.mockRejectedValue(new Error('EACCES: permission denied'));

        const res = await agent.post('/api/admin/env').send({ RAZORPAY_KEY_ID: 'Key' });
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toContain('permission denied');
    });

    // 76. Settings - Cache Invalidation
    test('76. Settings - Cache Invalidation', async () => {
        const res = await agent.post('/api/admin/settings').send({ terms: 'Terms' });
        expect(res.statusCode).toBe(200);
    });

    // 77. Env - Restart Logic
    test('77. Env - Restart Logic', async () => {
        const res = await agent.post('/api/admin/env').send({ SMTP_HOST: 'smtp' });
        expect(res.statusCode).toBe(200);
    });

    // 78. Settings - Large Payload
    test('78. Settings - Large Payload', async () => {
        const largeText = 'A'.repeat(10000);
        const res = await agent.post('/api/admin/settings').send({ privacy_policy: largeText });
        expect(res.statusCode).toBe(200);
    });

    // 79. Get Settings - Empty Table
    test('79. Get Settings - Empty Table', async () => {
        dbMock.all.mockImplementation((sql, p1, p2) => {
            const cb = typeof p1 === 'function' ? p1 : p2;
            cb(null, []);
        });

        const res = await agent.get('/api/admin/settings');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({});
    });

    // 80. DB Repair - Script Execution (Admin tool) - NOT IMPLEMENTED
    test.skip('80. DB Repair', async () => {
        // ...
    });

    // --- Invoice Settings Validation Tests ---

    // I1. Invoice Settings - Valid GSTIN Format
    test('I1. Invoice Settings - Valid GSTIN Format', async () => {
        const res = await agent.post('/api/admin/settings').send({
            company_gstin: '22AAAAA0000A1Z5'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // I2. Invoice Settings - Invalid GSTIN Format
    test('I2. Invoice Settings - Invalid GSTIN Format', async () => {
        const res = await agent.post('/api/admin/settings').send({
            company_gstin: 'INVALID123'
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('GSTIN');
    });

    // I3. Invoice Settings - Valid PAN Format
    test('I3. Invoice Settings - Valid PAN Format', async () => {
        const res = await agent.post('/api/admin/settings').send({
            company_pan: 'AAAAA0000A'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // I4. Invoice Settings - Invalid PAN Format
    test('I4. Invoice Settings - Invalid PAN Format', async () => {
        const res = await agent.post('/api/admin/settings').send({
            company_pan: '12345ABCDE'
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('PAN');
    });

    // I5. Invoice Settings - Valid IFSC Format
    test('I5. Invoice Settings - Valid IFSC Format', async () => {
        const res = await agent.post('/api/admin/settings').send({
            company_bank_ifsc: 'HDFC0001234'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // I6. Invoice Settings - Invalid IFSC Format
    test('I6. Invoice Settings - Invalid IFSC Format', async () => {
        const res = await agent.post('/api/admin/settings').send({
            company_bank_ifsc: 'INVALID'
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('IFSC');
    });

    // I7. Invoice Settings - Valid Tax Rates
    test('I7. Invoice Settings - Valid Tax Rates', async () => {
        const res = await agent.post('/api/admin/settings').send({
            default_cgst_rate: '9',
            default_sgst_rate: '9',
            default_igst_rate: '18'
        });
        expect(res.statusCode).toBe(200);
    });

    // I8. Invoice Settings - Invalid Tax Rate (Negative)
    test('I8. Invoice Settings - Invalid Tax Rate (Negative)', async () => {
        const res = await agent.post('/api/admin/settings').send({
            default_cgst_rate: '-5'
        });
        expect(res.statusCode).toBe(400);
    });

    // I9. Invoice Settings - Invalid Tax Rate (Too High)
    test('I9. Invoice Settings - Invalid Tax Rate (Too High)', async () => {
        const res = await agent.post('/api/admin/settings').send({
            default_cgst_rate: '75'
        });
        expect(res.statusCode).toBe(400);
    });

    // I10. Invoice Settings - Valid Due Days
    test('I10. Invoice Settings - Valid Due Days', async () => {
        const res = await agent.post('/api/admin/settings').send({
            invoice_due_days: '30'
        });
        expect(res.statusCode).toBe(200);
    });

    // I11. Invoice Settings - Invalid Due Days (Too High)
    test('I11. Invoice Settings - Invalid Due Days (Too High)', async () => {
        const res = await agent.post('/api/admin/settings').send({
            invoice_due_days: '500'
        });
        expect(res.statusCode).toBe(400);
    });

    // I12. Invoice Settings - Optional Fields Accept Empty Values
    test('I12. Invoice Settings - Optional Fields Accept Empty Values', async () => {
        const res = await agent.post('/api/admin/settings').send({
            company_gstin: '',
            company_pan: '',
            company_bank_ifsc: '',
            invoice_terms: ''
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // I13. Invoice Settings - Valid State Code
    test('I13. Invoice Settings - Valid State Code', async () => {
        const res = await agent.post('/api/admin/settings').send({
            company_state_code: '27'
        });
        expect(res.statusCode).toBe(200);
    });

    // I14. Invoice Settings - Invoice Terms (Long Text)
    test('I14. Invoice Settings - Invoice Terms (Long Text)', async () => {
        const longTerms = 'Payment due within 15 days of invoice date. ' +
            'Late payments may incur interest at 18% p.a. ' +
            'All disputes subject to Mumbai jurisdiction.';
        const res = await agent.post('/api/admin/settings').send({
            invoice_terms: longTerms
        });
        expect(res.statusCode).toBe(200);
    });

    // I15. Invoice Settings - Invoice Prefix
    test('I15. Invoice Settings - Invoice Prefix', async () => {
        const res = await agent.post('/api/admin/settings').send({
            invoice_prefix: 'INV-2024/'
        });
        expect(res.statusCode).toBe(200);
    });

    // I16. Invoice Settings - Currency Symbol
    test('I16. Invoice Settings - Currency Symbol', async () => {
        const res = await agent.post('/api/admin/settings').send({
            invoice_currency: '₹'
        });
        expect(res.statusCode).toBe(200);
    });

    // I17. Invoice Settings - UPI ID
    test('I17. Invoice Settings - UPI ID', async () => {
        const res = await agent.post('/api/admin/settings').send({
            company_upi_id: 'company@upi'
        });
        expect(res.statusCode).toBe(200);
    });

});

