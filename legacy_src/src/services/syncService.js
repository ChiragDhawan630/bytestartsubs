const db = require('../config/database');
const razorpayService = require('./razorpayService');

/**
 * Sync all data from Razorpay
 */
const syncAll = async () => {
    console.log('[Sync] Starting full synchronization...');
    try {
        const planStats = await syncPlans();
        const subStats = await syncSubscriptions();
        console.log(`[Sync] Completed. Plans: ${planStats.updated} updated, Subscriptions: ${subStats.added} added, ${subStats.updated} updated.`);
        return { success: true, plans: planStats, subscriptions: subStats };
    } catch (error) {
        console.error('[Sync] Full sync failed:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Sync Plans from Razorpay
 */
const syncPlans = async () => {
    try {
        const result = await razorpayService.fetchPlans();
        const plans = result.items || [];
        let updated = 0;

        for (const plan of plans) {
            const row = await db.getAsync('SELECT id FROM plans WHERE razorpay_plan_id = $1', [plan.id]);
            if (row) {
                await db.runAsync(
                    'UPDATE plans SET name = $1, price_discounted = $2 WHERE razorpay_plan_id = $3',
                    [plan.item.name, plan.item.amount / 100, plan.id]
                );
                updated++;
            }
            // We don't auto-insert plans because they need category and features
        }
        return { updated };
    } catch (error) {
        console.error('[Sync] Plan sync failed:', error.message);
        throw error;
    }
};

/**
 * Sync Subscriptions from Razorpay
 */
const syncSubscriptions = async (count = 100) => {
    try {
        const result = await razorpayService.fetchSubscriptions(count);
        const subs = result.items || [];
        let added = 0;
        let updated = 0;

        for (const sub of subs) {
            const row = await db.getAsync('SELECT id FROM subscriptions WHERE razorpay_sub_id = $1', [sub.id]);
            const startDate = new Date(sub.start_at * 1000).toISOString();
            const renewalDate = sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null;

            if (row) {
                await db.runAsync(
                    'UPDATE subscriptions SET status = $1, plan_id = $2, renewal_date = $3 WHERE id = $4',
                    [sub.status, sub.plan_id, renewalDate, row.id]
                );
                updated++;
            } else {
                await db.runAsync(
                    'INSERT INTO subscriptions (razorpay_sub_id, plan_id, status, start_date, renewal_date, user_id) VALUES ($1, $2, $3, $4, $5, NULL)',
                    [sub.id, sub.plan_id, sub.status, startDate, renewalDate]
                );
                added++;
            }
        }
        return { added, updated };
    } catch (error) {
        console.error('[Sync] Subscription sync failed:', error.message);
        throw error;
    }
};

module.exports = {
    syncAll,
    syncPlans,
    syncSubscriptions
};
