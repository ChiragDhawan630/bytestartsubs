const request = require('supertest');
const app = require('../app');
const env = require('../config/env');

// Mocks
jest.mock('../config/database', () => ({
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
    serialize: jest.fn((cb) => cb()),
}));
jest.mock('../services/razorpayService', () => ({
    createPlan: jest.fn(),
}));

const dbMock = require('../config/database');
const razorpayService = require('../services/razorpayService');

describe('6. Admin - Plans & Categories', () => {
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
            'FROM users': (cb) => cb(null, { id: 1, email: adminEmail, role: 'admin' }),
            'FROM subscriptions': (cb) => cb(null, { count: 0 }),
            'FROM plans': (cb) => cb(null, { count: 0 })
        }));

        dbMock.run.mockImplementation(function (sql, params, cb) {
            const callback = cb || params;
            if (callback && typeof callback === 'function') callback.call({ changes: 1 }, null);
        });

        await agent.post('/auth/dev/login').send({ email: adminEmail });
    });

    // 56. Create Category - Duplicate ID
    test('56. Create Category - Duplicate ID', async () => {
        dbMock.run.mockImplementation(function (sql, params, cb) {
            const callback = cb || params;
            callback(new Error('UNIQUE constraint failed: categories.id'));
        });

        const res = await agent.post('/api/admin/categories').send({ id: 'cat_dup', name: 'Dup' });
        expect(res.statusCode).toBe(500);
    });

    // 57. Create Category - Missing Name
    test('57. Create Category - Missing Name', async () => {
        dbMock.run.mockImplementation(function (sql, params, cb) {
            const callback = cb || params;
            callback(new Error('NOT NULL constraint failed: categories.name'));
        });

        const res = await agent.post('/api/admin/categories').send({ id: 'cat_no_name' });
        expect(res.statusCode).toBe(500);
    });

    // 58. Update Category - Invalid ID
    test('58. Update Category - Invalid ID', async () => {
        dbMock.run.mockImplementation(function (sql, params, cb) {
            const callback = cb || params;
            callback.call({ changes: 0 }, null);
        });

        const res = await agent.put('/api/admin/categories/invalid_id').send({ name: 'Update' });
        expect(res.statusCode).toBe(404);
    });

    // 59. Delete Category - In Use
    test('59. Delete Category - In Use', async () => {
        dbMock.get.mockImplementation(robustMock({
            'FROM plans': (cb) => cb(null, { count: 5 }), // 5 linked
            'FROM users': (cb) => cb(null, { id: 1 }) // Login
        }));

        const res = await agent.delete('/api/admin/categories/cat_used');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/linked plans/i);
    });

    // 60. Create Plan - Invalid JSON Features
    test('60. Create Plan - Invalid JSON Features', async () => {
        const res = await agent.post('/api/admin/plans').send({
            id: 'plan_bad_json',
            name: 'Bad Plan',
            features: "not_an_array"
        });
        expect(res.statusCode).toBe(400);
    });

    // 61. Create Plan - Negative Price
    test('61. Create Plan - Negative Price', async () => {
        const res = await agent.post('/api/admin/plans').send({
            id: 'plan_neg',
            name: 'Neg Plan',
            price_discounted: -100
        });
        expect(res.statusCode).toBe(400);
    });

    // 62. Update Plan - Razorpay ID Mismatch
    test('62. Update Plan - Razorpay ID Mismatch', async () => {
        const res = await agent.put('/api/admin/plans/plan_1').send({
            name: 'Updated Name',
            razorpay_plan_id: 'old_rz_id'
        });
        expect(res.statusCode).toBe(200);
    });

    // 63. Delete Plan - Active Subs Linked
    test('63. Delete Plan - Active Subs Linked', async () => {
        dbMock.get.mockImplementation(robustMock({
            'FROM subscriptions': (cb) => cb(null, { count: 3 }),
            'FROM users': (cb) => cb(null, { id: 1 })
        }));

        const res = await agent.delete('/api/admin/plans/plan_active');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/active subscriptions/i);
    });

    // 64. Razorpay Plan Create - API Fail
    test('64. Razorpay Plan Create - API Fail', async () => {
        razorpayService.createPlan.mockRejectedValue(new Error('Razorpay Error'));

        const res = await agent.post('/api/admin/razorpay/plans').send({ name: 'RZ Plan' });
        expect(res.statusCode).toBe(500);
    });

    // 65. Razorpay Plan Create - Invalid input
    test('65. Razorpay Plan Create - Invalid input', async () => {
        razorpayService.createPlan.mockRejectedValue(new Error('Invalid currency'));

        const res = await agent.post('/api/admin/razorpay/plans').send({ currency: 'XX' });
        expect(res.statusCode).toBe(500);
    });

    // 66. Get Plans - Empty DB
    test('66. Get Plans - Empty DB', async () => {
        dbMock.all.mockImplementation((sql, cb) => {
            cb(new Error('no such table: plans'), null);
        });

        const res = await agent.get('/api/admin/plans');
        expect(res.statusCode).toBe(500);
    });

    // 67. Plan Color - Invalid Hex
    test('67. Plan Color - Invalid Hex', async () => {
        // Accepted as is
        const res = await agent.post('/api/admin/plans').send({
            id: 'plan_color',
            name: 'Color Plan',
            price_color: 'red'
        });
        expect(res.statusCode).toBe(200);
    });

    // 69. Plan Sort Order - Duplicate
    test('69. Plan Sort Order - Duplicate', async () => {
        // Accepted as is
        const res = await agent.post('/api/admin/plans').send({
            id: 'plan_sort',
            name: 'Sort Plan',
            display_order: 1
        });
        expect(res.statusCode).toBe(200);
    });

    // 70. Category Icon - XSS
    test('70. Category Icon - XSS', async () => {
        // Accepted as is
        const res = await agent.post('/api/admin/categories').send({
            id: 'cat_xss',
            name: 'XSS',
            icon: '<script>alert(1)</script>'
        });
        expect(res.statusCode).toBe(200);
    });
});
