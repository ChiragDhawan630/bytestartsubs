const syncService = require('../services/syncService');
const razorpayService = require('../services/razorpayService');
const db = require('../config/database');

jest.mock('../services/razorpayService');
jest.mock('../config/database', () => ({
    get: jest.fn(),
    run: jest.fn(),
    all: jest.fn()
}));

describe('syncService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('syncPlans', () => {
        it('should update existing plans', async () => {
            razorpayService.fetchPlans.mockResolvedValue({
                items: [{
                    id: 'plan_123',
                    item: { name: 'Test Plan', amount: 50000 }
                }]
            });

            db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1 }));
            db.run.mockImplementation((sql, params, cb) => cb(null));

            const stats = await syncService.syncPlans();
            expect(stats.updated).toBe(1);
            expect(db.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE plans'),
                ['Test Plan', 500, 'plan_123'],
                expect.any(Function)
            );
        });

        it('should handle empty plan list', async () => {
            razorpayService.fetchPlans.mockResolvedValue({ items: [] });
            const stats = await syncService.syncPlans();
            expect(stats.updated).toBe(0);
        });
    });

    describe('syncSubscriptions', () => {
        it('should update existing subscriptions', async () => {
            razorpayService.fetchSubscriptions.mockResolvedValue({
                items: [{
                    id: 'sub_123',
                    status: 'active',
                    plan_id: 'plan_123',
                    start_at: 1704110400, // 2024-01-01
                    current_end: 1706788800 // 2024-02-01
                }]
            });

            db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1 }));
            db.run.mockImplementation((sql, params, cb) => cb(null));

            const stats = await syncService.syncSubscriptions();
            expect(stats.updated).toBe(1);
            expect(db.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE subscriptions'),
                ['active', 'plan_123', expect.any(String), 1],
                expect.any(Function)
            );
        });

        it('should insert new subscriptions', async () => {
            razorpayService.fetchSubscriptions.mockResolvedValue({
                items: [{
                    id: 'sub_new',
                    status: 'created',
                    plan_id: 'plan_123',
                    start_at: 1704110400
                }]
            });

            db.get.mockImplementation((sql, params, cb) => cb(null, null));
            db.run.mockImplementation((sql, params, cb) => cb(null));

            const stats = await syncService.syncSubscriptions();
            expect(stats.added).toBe(1);
            expect(db.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO subscriptions'),
                ['sub_new', 'plan_123', 'created', expect.any(String), null],
                expect.any(Function)
            );
        });
    });
});
