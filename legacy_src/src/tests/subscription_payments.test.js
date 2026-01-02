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
    sendSubscriptionEmail: jest.fn(), // Mock email service
}));

const dbMock = require('../config/database');
const razorpayService = require('../services/razorpayService');
const emailService = require('../services/emailService');

describe('3. Subscriptions & Payments', () => {
    let agent;

    beforeAll(() => {
        agent = request.agent(app);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Ensure env has secret
        env.RAZORPAY_KEY_SECRET = 'test_secret';

        // Default: Authenticated User (ID=1)
        dbMock.get.mockImplementation((sql, params, cb) => {
            if (sql.includes('FROM users WHERE id')) {
                cb(null, { id: 1, email: 'test@example.com', name: 'Tester' });
            } else {
                cb(null, null);
            }
        });

        // Default Run: Success
        dbMock.run.mockImplementation(function (sql, params, cb) {
            if (cb) cb(null);
            else if (typeof params === 'function') params(null);
        });
    });

    const login = async () => {
        await agent.post('/auth/dev/login').send({ email: 'test@example.com' });
    };

    // 26. Create Sub - No Plan Type
    test('26. Create Sub - No Plan Type', async () => {
        await login();
        const res = await agent.post('/api/subscription/create').send({});
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/No plan selected/i);
    });

    // 27. Create Sub - Invalid Plan Type
    test('27. Create Sub - Invalid Plan Type', async () => {
        await login();
        dbMock.get.mockImplementation((sql, params, cb) => {
            if (sql.includes('FROM users')) cb(null, { id: 1, email: 't' });
            else if (sql.includes('FROM plans')) cb(null, null);
            else cb(null, null);
        });
        const res = await agent.post('/api/subscription/create').send({ plan_type: 'invalid_plan' });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/Plan configuration error|not found/i);
    });

    // 28. Create Sub - DB Plan ID Missing
    test('28. Create Sub - DB Plan ID Missing', async () => {
        await login();
        dbMock.get.mockImplementation((sql, params, cb) => {
            if (sql.includes('FROM users')) cb(null, { id: 1 });
            else if (sql.includes('FROM plans')) cb(null, { id: 'plan_x', razorpay_plan_id: null });
            else cb(null, null);
        });
        const res = await agent.post('/api/subscription/create').send({ plan_type: 'plan_x' });
        expect(res.statusCode).toBe(400);
    });

    // 29. Create Sub - Razorpay API Fail
    test('29. Create Sub - Razorpay API Fail', async () => {
        await login();
        dbMock.get.mockImplementation((sql, params, cb) => {
            if (sql.includes('FROM users')) cb(null, { id: 1, email: 't' });
            else if (sql.includes('FROM plans')) cb(null, { razorpay_plan_id: 'plan_123' });
            else cb(null, null);
        });

        razorpayService.getInstance.mockReturnValue({
            subscriptions: {
                create: jest.fn().mockRejectedValue(new Error('Network Error'))
            }
        });

        const res = await agent.post('/api/subscription/create').send({ plan_type: 'basic' });
        expect(res.statusCode).toBe(500);
    });

    // 30. Verify Payment - Missing Params
    test('30. Verify Payment - Missing Params', async () => {
        await login();
        const res = await agent.post('/api/subscription/verify').send({ plan_type: 'basic' });
        expect(res.statusCode).toBe(400);
    });

    // 31. Verify Payment - Invalid ID
    test('31. Verify Payment - Invalid ID', async () => {
        await login();

        const payload = {
            razorpay_subscription_id: 'invalid_sub_id',
            razorpay_payment_id: 'pay_123',
            plan_type: 'basic'
        };
        // Generate valid signature for payload to pass signature check
        payload.razorpay_signature = crypto
            .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
            .update(payload.razorpay_payment_id + '|' + payload.razorpay_subscription_id)
            .digest('hex');

        // Default db.get returns null for sub -> 404
        const res = await agent.post('/api/subscription/verify').send(payload);
        expect(res.statusCode).toBe(404);
    });

    // 32. Verify Payment - Already Active
    test('32. Verify Payment - Already Active', async () => {
        await login();
        dbMock.get.mockImplementation((sql, params, cb) => {
            if (sql.includes('FROM subscriptions')) {
                cb(null, { status: 'active', razorpay_sub_id: 'sub_active' });
            } else if (sql.includes('FROM users')) {
                cb(null, { id: 1, email: 't' });
            } else {
                cb(null, null);
            }
        });

        const payload = {
            razorpay_subscription_id: 'sub_active',
            razorpay_payment_id: 'pay_active',
            plan_type: 'basic'
        };
        payload.razorpay_signature = crypto
            .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
            .update(payload.razorpay_payment_id + '|' + payload.razorpay_subscription_id)
            .digest('hex');

        const res = await agent.post('/api/subscription/verify').send(payload);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/Already active/i);
    });

    // 33. Resubscribe - Missing Original Sub ID
    test('33. Resubscribe - Missing Original Sub ID', async () => {
        await login();
        const res = await agent.post('/api/subscription/resubscribe').send({});
        expect(res.statusCode).toBe(400);
    });

    // 34. Resubscribe - ID Not Found
    test('34. Resubscribe - ID Not Found', async () => {
        await login();
        razorpayService.getInstance.mockReturnValue({
            subscriptions: {
                fetch: jest.fn().mockRejectedValue({ statusCode: 400, error: { code: 'BAD_REQUEST_ERROR' } })
            }
        });
        const res = await agent.post('/api/subscription/resubscribe').send({ subscription_id: 'invalid' });
        expect(res.statusCode).toBe(404);
    });

    // 35. Resubscribe - Foreign User
    test('35. Resubscribe - Foreign User', async () => {
        await login(); // User ID 1
        razorpayService.getInstance.mockReturnValue({
            subscriptions: {
                fetch: jest.fn().mockResolvedValue({
                    id: 'sub_foreign',
                    plan_id: 'plan_1',
                    notes: { user_id: '999' } // Not user 1
                })
            }
        });
        const res = await agent.post('/api/subscription/resubscribe').send({ subscription_id: 'sub_foreign' });
        expect(res.statusCode).toBe(403);
    });

    // 36. Email - Verify Failure
    test('36. Email - Verify Failure', async () => {
        await login();
        dbMock.get.mockImplementation((sql, params, cb) => {
            if (sql.includes('FROM subscriptions')) cb(null, { status: 'created' });
            else if (sql.includes('FROM users')) cb(null, { id: 1, email: 't' });
            else cb(null, null);
        });

        emailService.sendSubscriptionEmail.mockImplementation(() => {
            throw new Error('SMTP Error');
        });

        const payload = {
            razorpay_subscription_id: 'sub_new',
            razorpay_payment_id: 'pay_new',
            plan_type: 'basic'
        };
        payload.razorpay_signature = crypto
            .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
            .update(payload.razorpay_payment_id + '|' + payload.razorpay_subscription_id)
            .digest('hex');

        const res = await agent.post('/api/subscription/verify').send(payload);
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
    });

});
