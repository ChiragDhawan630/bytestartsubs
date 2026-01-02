const request = require('supertest');
const app = require('../app');
const db = require('../config/database');

describe('Subscription API', () => {
    let agent;
    let userId;
    let planId;

    beforeAll(async () => {
        // Setup Test User
        try {
            await db.runAsync('DELETE FROM users WHERE email = $1', ['test_sub@example.com']);
            const res = await db.runAsync(
                `INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING id`,
                ['Test Sub', 'test_sub@example.com', 'google_sub_123']
            );
            // Handle different PG return structures if needed
            if (res.rows && res.rows[0]) {
                userId = res.rows[0].id;
            } else if (res.lastID) {
                userId = res.lastID;
            }
        } catch (e) {
            console.error("Setup failed", e);
        }

        // Get an active plan
        const plan = await db.getAsync('SELECT id FROM plans WHERE is_active = TRUE LIMIT 1');
        if (!plan) throw new Error("No active plans found for test.");
        planId = plan.id;

        // Login Agent
        agent = request.agent(app);

        // Mock Session via Dev Login
        // Ensure app detects dev mode
        process.env.APP_ENV = 'dev';
        await agent
            .post('/auth/dev/login')
            .send({ email: 'test_sub@example.com' })
            .expect(200);
    });

    afterAll(async () => {
        // Cleanup
        if (userId) {
            await db.runAsync('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
            await db.runAsync('DELETE FROM users WHERE id = $1', [userId]);
        }
    });

    test('POST /api/subscription/create - Should create subscription', async () => {
        const res = await agent
            .post('/api/subscription/create')
            .send({ plan_type: planId })
            .expect(200);

        expect(res.body).toHaveProperty('subscription_id');
        expect(res.body).toHaveProperty('key_id');
        expect(res.body.user_email).toBe('test_sub@example.com');
    });

    test('POST /api/subscription/create - Should fail without plan_type', async () => {
        await agent
            .post('/api/subscription/create')
            .send({})
            .expect(400);
    });
});
