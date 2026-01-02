const request = require('supertest');
const app = require('../app');
const crypto = require('crypto');
const env = require('../config/env');

// Mocks
jest.mock('../config/database', () => ({
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
    configure: jest.fn(),
}));
jest.mock('../services/razorpayService', () => ({
    getInstance: jest.fn(),
    fetchSubscription: jest.fn(),
}));
jest.mock('../services/emailService', () => ({
    sendSubscriptionEmail: jest.fn(),
}));

const dbMock = require('../config/database');
const razorpayService = require('../services/razorpayService');

describe('3. Subscriptions & Payments - Advanced', () => {
    let agent;

    beforeAll(() => {
        agent = request.agent(app);
        // Ensure env has secret for signature verification
        env.RAZORPAY_KEY_SECRET = 'test_secret';
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: Authenticated User (ID=1)
        dbMock.get.mockImplementation((sql, params, cb) => {
            if (sql.includes('FROM users WHERE id')) {
                cb(null, { id: 1, email: 'test@example.com', name: 'Tester' });
            } else {
                cb(null, null);
            }
        });
        dbMock.run.mockImplementation(function (sql, params, cb) {
            if (cb) cb(null);
            else if (typeof params === 'function') params(null);
        });
    });

    const login = async () => {
        await agent.post('/auth/dev/login').send({ email: 'test@example.com' });
    };

    // 38. Payment - Signature Mismatch
    test('38. Payment - Signature Mismatch', async () => {
        await login();

        // Mock DB finding the subscription
        dbMock.get.mockImplementation((sql, params, cb) => {
            if (sql.includes('FROM subscriptions')) {
                cb(null, { status: 'created', razorpay_sub_id: 'sub_123' });
            } else if (sql.includes('FROM users')) {
                cb(null, { id: 1, email: 'test@example.com' });
            } else {
                cb(null, null);
            }
        });

        const payload = {
            razorpay_subscription_id: 'sub_123',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: 'fake_signature', // Invalid signature
            plan_type: 'basic'
        };

        const res = await agent.post('/api/subscription/verify').send(payload);

        // If signature verification is implemented, this should be 400. 
        // If not, it currently returns 200 (Success).
        // The Test Case requires Expect 400.
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/signature/i);
    });

    // 39. Concurrent Creation
    test('39. Concurrent Creation', async () => {
        await login();

        // Mock plan lookup
        dbMock.get.mockImplementation((sql, params, cb) => {
            if (sql.includes('FROM plans')) {
                cb(null, { id: 'basic', razorpay_plan_id: 'plan_123', is_active: 1 });
            } else if (sql.includes('FROM users')) {
                cb(null, { id: 1, email: 'test@example.com' });
            } else {
                cb(null, null);
            }
        });

        razorpayService.getInstance.mockReturnValue({
            subscriptions: {
                create: jest.fn().mockResolvedValue({ id: 'sub_new_concurrent', status: 'created' })
            }
        });

        // Send 5 concurrent requests
        const reqs = Array(5).fill().map(() =>
            agent.post('/api/subscription/create').send({ plan_type: 'basic' })
        );

        const responses = await Promise.all(reqs);

        // Use a Set to count unique subscription IDs created if logic allows multiple
        // Or check that all returned 200.
        const statutes = responses.map(r => r.statusCode);
        expect(statutes.every(s => s === 200)).toBe(true);

        // Check how many times insert was called
        const insertCalls = dbMock.run.mock.calls.filter(call => call[0].includes('INSERT INTO subscriptions'));
        expect(insertCalls.length).toBe(5); // Should create 5 subs or handle debouncing
    });

    // 40. Plan Logic - Deleted Plan
    test('40. Plan Logic - Deleted Plan', async () => {
        await login();

        // Mock DB returning an inactive plan (deleted logic usually is_active=0 or soft delete)
        dbMock.get.mockImplementation((sql, params, cb) => {
            if (sql.includes('FROM plans')) {
                cb(null, { id: 'basic', razorpay_plan_id: 'plan_123', is_active: 0 }); // Inactive
            } else if (sql.includes('FROM users')) {
                cb(null, { id: 1, email: 'test@example.com' });
            } else {
                cb(null, null);
            }
        });

        const res = await agent.post('/api/subscription/create').send({ plan_type: 'basic' });

        // Should fail because plan is inactive
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/plan.*inactive|deleted/i);
    });
});
