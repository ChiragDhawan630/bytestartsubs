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

const dbMock = require('../config/database');

describe('4. Admin - Main Dashboard & Stats', () => {
    let agent;
    const adminEmail = 'admin@test.com';

    beforeAll(() => {
        agent = request.agent(app);
        env.APP_ENV = 'dev';
        env.ADMIN_EMAIL = adminEmail;
        env.ADMIN_PASS = 'secret';
    });

    const robustGetImplementation = (logicMap) => {
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
            if (!handled) cb(null, null);
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        dbMock.get.mockImplementation(robustGetImplementation({
            'FROM users': (cb, params) => cb(null, { id: 1, email: adminEmail, role: 'admin' })
        }));

        dbMock.run.mockImplementation(function (sql, params, cb) {
            if (cb) cb(null);
            else if (typeof params === 'function') params(null);
        });
    });

    const loginAdmin = async () => {
        const res = await agent.post('/auth/dev/login').send({ email: adminEmail });
        if (res.status !== 200) {
            console.error('Login Failed', res.statusCode, res.body);
            throw new Error('Admin Login Failed');
        }
    };

    test.skip('41. Stats - DB Lock', async () => {
        await loginAdmin();

        dbMock.get.mockImplementation((sql, p1, p2) => {
            const cb = typeof p1 === 'function' ? p1 : p2;
            if (sql.includes('COUNT')) {
                cb(new Error('SQLITE_BUSY: database is locked'));
            } else if (sql.includes('FROM users')) {
                cb(null, { id: 1, email: adminEmail, role: 'admin' });
            } else {
                cb(null, null);
            }
        });

        const res = await agent.get('/api/admin/stats');
        expect(res.statusCode).toBe(500);
    });

    test('42. Activity Logs - Huge Data', async () => {
        await loginAdmin();

        let executedSql = '';
        dbMock.all.mockImplementation((sql, cb) => {
            executedSql = sql;
            cb(null, Array(100).fill({ id: 1, action: 'test' }));
        });

        const res = await agent.get('/api/admin/activity');
        expect(res.statusCode).toBe(200);
        expect(executedSql).toMatch(/LIMIT 100/i);
        expect(res.body.length).toBe(100);
    });

    test('43. Error Logs - Clear Fail', async () => {
        await loginAdmin();

        dbMock.run.mockImplementation((sql, params, cb) => {
            if (sql.includes('DELETE FROM error_logs')) {
                const callback = cb || params;
                callback(new Error('Write Failed'));
            } else {
                if (cb) cb(null);
                else if (typeof params === 'function') params(null);
            }
        });

        const res = await agent.delete('/api/admin/errors');
        expect(res.statusCode).toBe(500);
    });

    test('44. Resolve Error - Invalid ID', async () => {
        await loginAdmin();

        const res = await agent.post('/api/admin/errors/999999/resolve');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('45. Stats - Calculation Overflow', async () => {
        await loginAdmin();

        const superHugeCount = 20000000000000;

        dbMock.serialize.mockImplementation(cb => cb());
        dbMock.get.mockImplementation(robustGetImplementation({
            'FROM users': (cb) => cb(null, { count: superHugeCount, id: 1, email: adminEmail }),
            'FROM subscriptions': (cb) => cb(null, { count: superHugeCount })
        }));

        const res = await agent.get('/api/admin/stats');
        expect(res.statusCode).toBe(200);
        expect(res.body.activeSubs).toBe(superHugeCount);
        const expectedRevenue = superHugeCount * 1000;
        expect(res.body.revenue).toBe(expectedRevenue);
    });
});
