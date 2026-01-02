const request = require('supertest');
const app = require('../app');
const env = require('../config/env');

describe('1. Authentication & Security', () => {

    const VALID_ADMIN_EMAIL = env.ADMIN_EMAIL || 'admin@example.com';

    test('1. Admin Login - Empty Credentials', async () => {
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: '', password: '' });
        expect(res.statusCode).toBe(400);
    });

    test('2. Admin Login - Invalid Email Format', async () => {
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: 'admin@', password: 'somepassword' });
        expect(res.statusCode).toBe(400);
    });

    test('3. Admin Login - Wrong Password', async () => {
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: VALID_ADMIN_EMAIL, password: 'wrongpassword' });
        expect(res.statusCode).toBe(401);
    });

    test('4. Admin Login - Non-existent Admin', async () => {
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: 'fakeadmin@example.com', password: 'password' });
        expect(res.statusCode).toBe(401);
    });

    test('5. Rate Limiting - Admin Login', async () => {
        // Attempts 1-5
        for (let i = 0; i < 5; i++) {
            await request(app)
                .post('/api/admin/login')
                .send({ email: 'spam@example.com', password: 'wrong' });
        }
        // 6th attempt
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: 'spam@example.com', password: 'wrong' });

        expect(res.statusCode).toBe(429);
    });

    test('7. Dev Login - Empty Email', async () => {
        const res = await request(app)
            .post('/auth/dev/login')
            .send({}); // Empty
        expect(res.statusCode).toBe(400);
    });

    // 12. Middleware - IsAdmin Bypass
    test('12. Middleware - IsAdmin Bypass for Normal User', async () => {
        // We need to login as dev user first
        // Creating an agent to keep cookie
        const agent = request.agent(app);

        // Login as dev user
        await agent.post('/auth/dev/login').send({ email: 'user@example.com' });

        // Try accessing admin stats
        const res = await agent.get('/api/admin/stats');
        expect(res.statusCode).toBe(403);
    });

    // 13. Middleware - Unauthenticated Admin Access
    test('13. Middleware - Unauthenticated Admin Access', async () => {
        const res = await request(app).get('/api/admin/users');
        // Expect redirect (302) or 401/403.
        // Middleware likely redirects to / or /auth
        expect([401, 403, 302]).toContain(res.statusCode);
    });

    // 14. SQL Injection
    test('14. SQL Injection - Login', async () => {
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: "' OR '1'='1", password: 'password' });
        // The regex validation returns 400. 
        // If rate limit triggered by Test 5, then 429.
        expect([400, 429]).toContain(res.statusCode);
    });

    // 15. Logout
    test('15. Logout - Repeated Calls', async () => {
        const agent = request.agent(app);
        // Login first
        await agent.post('/auth/dev/login').send({ email: 'logout@example.com' });

        // Logout once
        let res = await agent.get('/auth/logout');
        expect([200, 302]).toContain(res.statusCode);

        // Logout again
        res = await agent.get('/auth/logout');
        expect([200, 302]).toContain(res.statusCode);
    });
});
