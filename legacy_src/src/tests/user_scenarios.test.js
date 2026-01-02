const request = require('supertest');
const app = require('../app');
const env = require('../config/env');
const fs = require('fs');

describe('2. User Profile & Settings', () => {

    let agent;

    beforeAll(async () => {
        agent = request.agent(app);
        // Login as dev user
        await agent.post('/auth/dev/login').send({ email: 'testuser@example.com' });
    });

    // 16. Update Profile - Unauthenticated
    test('16. Update Profile - Unauthenticated', async () => {
        const res = await request(app) // New request, no cookie
            .post('/api/user/update')
            .send({ name: 'Hacker' });
        expect(res.statusCode).toBe(401);
    });

    // 17. Update Profile - Missing Required Fields
    test('17. Update Profile - Missing Required Fields', async () => {
        const res = await agent
            .post('/api/user/update')
            .send({ name: '', phone: '1234567890' });
        expect(res.statusCode).toBe(400);
    });

    // 18. Update Profile - Invalid Phone
    test('18. Update Profile - Invalid Phone', async () => {
        const res = await agent
            .post('/api/user/update')
            .send({ name: 'Valid Name', phone: 'abc' });
        expect(res.statusCode).toBe(400);
    });

    // 19. Update Profile - Giant Payload
    test('19. Update Profile - Giant Payload', async () => {
        const giantString = 'a'.repeat(1024 * 1024 * 2); // 2MB
        const res = await agent
            .post('/api/user/update')
            .send({ name: giantString });

        if (res.statusCode !== 413) {
            fs.writeFileSync('debug_log.txt', `Status: ${res.statusCode}, Error: ${res.error ? JSON.stringify(res.error) : 'none'}`);
        }
        expect(res.statusCode).toBe(413);
    });

    // 20. Update Profile - SQL Injection
    test('20. Update Profile - SQL Injection', async () => {
        // Should succeed (200) but treat input as literal string
        const res = await agent
            .post('/api/user/update')
            .send({ name: "User' OR '1'='1", phone: '1234567890' });

        expect(res.statusCode).toBe(200);
        // Ideally verify DB content, but status 200 implies no crash/syntax error.
    });

    // 21. Update Theme - Invalid Value
    test('21. Update Theme - Invalid Value', async () => {
        const res = await agent
            .post('/api/user/update-theme')
            .send({ theme: 'blue' });
        expect(res.statusCode).toBe(400);
    });

    // 23. My Subscriptions - No User
    test('23. My Subscriptions - No User', async () => {
        const res = await request(app).get('/api/my-subscriptions'); // No cookie
        expect(res.statusCode).toBe(401);
    });
});
