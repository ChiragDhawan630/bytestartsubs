const request = require('supertest');
const app = require('../app');
const env = require('../config/env');

// Mocks for PostgreSQL adapter
jest.mock('../config/database', () => ({
    getAsync: jest.fn(),
    allAsync: jest.fn(),
    runAsync: jest.fn(),
    pool: { query: jest.fn() },
}));

const dbMock = require('../config/database');

describe('5. Admin - User Management', () => {
    let agent;
    const adminEmail = 'admin@test.com';

    beforeAll(() => {
        agent = request.agent(app);
        env.APP_ENV = 'dev';
        env.ADMIN_EMAIL = adminEmail;
        env.ADMIN_PASS = 'secret';
    });

    // Robust Mock Helper
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

        // Setup default mocks for PostgreSQL async methods
        dbMock.getAsync.mockImplementation(async (sql, params) => {
            if (sql.includes('FROM users')) {
                return { id: 1, email: adminEmail, role: 'admin' };
            }
            return null;
        });

        dbMock.allAsync.mockResolvedValue([]);
        dbMock.runAsync.mockResolvedValue({ rowCount: 1, rows: [] });

        // Perform login
        await agent.post('/auth/dev/login').send({ email: adminEmail });
    });

    test('46. Get Users - Filter Injection', async () => {
        let executedSql = '';
        let executedParams = [];
        dbMock.allAsync.mockImplementation(async (sql, params) => {
            executedSql = sql;
            executedParams = params;
            return []; // Return empty list
        });

        const injection = "' OR '1'='1";
        const res = await agent.get('/api/admin/users').query({ search: injection });

        expect(res.statusCode).toBe(200);
        expect(executedSql).toContain('ILIKE');
        expect(executedParams).toContain(`%${injection}%`);
    });

    test('47. Update User - Duplicate Email', async () => {
        // Mock finding conflict. logicMap order matters? No, key match.
        // We need a way to distinguish "User Login" lookup vs "Duplicate Check" lookup.
        // Duplicate check checks: WHERE email = ? AND id != ?
        // Login check checks: WHERE email = ?

        dbMock.get.mockImplementation(robustMock({
            'AND id !=': (cb) => cb(null, { id: 2 }), // Found conflict
            'FROM users': (cb) => cb(null, { id: 1, email: adminEmail }) // Login fallback
        }));

        const res = await agent.post('/api/admin/users/1').send({
            name: 'User One',
            email: 'user2@test.com'
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/already in use/i);
    });

    test('48. Update User - Missing ID', async () => {
        // PUT /api/admin/users/ -> 404
        const res = await agent.put('/api/admin/users/');
        expect(res.statusCode).toBe(404);
    });

    test('49. Update User - Invalid ID Type', async () => {
        dbMock.run.mockImplementation(function (sql, params, cb) {
            const callback = cb || params;
            callback.call({ changes: 0 }, null); // 0 changes for invalid ID
        });

        const res = await agent.post('/api/admin/users/abc').send({ name: 'Valid Name' });
        expect(res.statusCode).toBe(404);
    });

    test('50. Delete User - Cascade Fail', async () => {
        dbMock.get.mockImplementation(robustMock({
            'FROM subscriptions': (cb) => cb(null, { count: 5 }), // Active subs found
            'FROM users': (cb) => cb(null, { id: 1 }) // Login
        }));

        const res = await agent.delete('/api/admin/users/1');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/active subscriptions/i);
    });

    test('51. User List - Pagination', async () => {
        let executedOffset;
        dbMock.all.mockImplementation((sql, params, cb) => {
            // params: [searchTerm, searchTerm, limit, offset]
            executedOffset = params[3];
            cb(null, []);
        });

        // Request page -1
        await agent.get('/api/admin/users').query({ page: -1, limit: 10 });
        expect(executedOffset).toBe(0);

        // Request page "abc" -> Parses to NaN. 
        // Logic: (Math.max(1, NaN) - 1) * limit.
        // Math.max(1, NaN) is NaN.
        // NaN * 10 is NaN.
        // So offset is NaN.
        // If offset is NaN, DB might fail or just work?
        // Let's see if we crash.

        await agent.get('/api/admin/users').query({ page: 'abc', limit: 10 });
        // Assuming it doesn't crash 500.
    });

    test('52. Update User - Read Only Fields', async () => {
        let executedSql = '';
        dbMock.run.mockImplementation(function (sql, params, cb) {
            executedSql = sql;
            if (cb) cb.call({ changes: 1 }, null);
            else params.call({ changes: 1 }, null);
        });

        await agent.post('/api/admin/users/1').send({
            name: 'New Name',
            google_id: 'hacker_id',
            created_at: '2020-01-01'
        });

        expect(executedSql).not.toContain('google_id');
        expect(executedSql).not.toContain('created_at');
    });

    test('53. Update User - Null Values', async () => {
        const res = await agent.post('/api/admin/users/1').send({ name: null });
        expect(res.statusCode).toBe(400);
    });

    test('54. Fetch User - Deleted', async () => {
        dbMock.run.mockImplementation(function (sql, params, cb) {
            const callback = cb || params;
            callback.call({ changes: 0 }, null);
        });

        const res = await agent.post('/api/admin/users/999').send({ name: 'Ghost' });
        expect(res.statusCode).toBe(404);
    });

    test('55. Audit Log - Update', async () => {
        let activityLogCalls = 0;
        dbMock.run.mockImplementation(function (sql, params, cb) {
            const callback = cb || params;
            if (sql.includes('INSERT INTO activity_logs')) {
                activityLogCalls++;
            }
            if (callback && typeof callback === 'function') {
                callback.call({ changes: 1 }, null);
            }
        });

        // Trigger update
        await agent.post('/api/admin/users/1').send({ name: 'Audit User' });

        // Expect at least one log (since we mocked run success)
        expect(activityLogCalls).toBeGreaterThan(0);
    });
});
