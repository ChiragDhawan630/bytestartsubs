const request = require('supertest');
const app = require('../app');
const env = require('../config/env');

jest.mock('../config/database', () => ({
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
    prepare: jest.fn(),
    serialize: jest.fn((cb) => cb()),
}));

describe('9. System & Infrastructure', () => {
    let agent;

    beforeAll(async () => {
        agent = request.agent(app);
    });

    // 95. Unhandled Exception - Error Handler Test
    test('95. Unhandled Exception (Malformed JSON)', async () => {
        const res = await agent.post('/auth/dev/login')
            .set('Content-Type', 'application/json')
            .send('{ "key": "value" '); // Syntax Error
        expect(res.statusCode).toBe(400);
    });

    // 96. CORS - Option Request
    test('96. CORS - Option Request', async () => {
        const res = await agent.options('/api/plans')
            .set('Origin', 'http://example.com')
            .set('Access-Control-Request-Method', 'GET');
        // Accept 204 or 200
        expect([200, 204]).toContain(res.statusCode);
        expect(res.headers['access-control-allow-origin']).toBe('*');
    });

    // 97. Static Files - Directory Traversal
    test('97. Static Files - Directory Traversal', async () => {
        const res = await agent.get('/..%2f..%2fWindows/win.ini');
        expect(res.statusCode).toBe(404);
    });

    // 98. Large Request Body
    test('98. Large Request Body', async () => {
        const largeData = 'a'.repeat(200 * 1024); // 200kb
        const res = await agent.post('/auth/dev/login')
            .send({ email: largeData });
        expect(res.statusCode).toBe(413);
    });

    // 99. Malformed JSON
    test('99. Malformed JSON', async () => {
        const res = await agent.post('/auth/dev/login')
            .set('Content-Type', 'application/json')
            .send('{ "key": value }');
        expect(res.statusCode).toBe(400);
    });

    // 101. Route 404
    test('101. Route 404', async () => {
        const res = await agent.get('/api/does-not-exist');
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Endpoint not found');
    });

    // 102. Method Not Allowed
    test('102. Method Not Allowed', async () => {
        const res = await agent.post('/api/plans');
        expect(res.statusCode).toBe(404);
    });

});
