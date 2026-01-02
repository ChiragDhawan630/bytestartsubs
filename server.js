const app = require('./src/app');
const env = require('./src/config/env');
const syncService = require('./src/services/syncService');
const cron = require('node-cron');

const port = env.PORT || 3000;

app.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Environment: ${env.APP_ENV || 'prod'}`);

    // 1. Run Sync on Startup
    console.log('[Startup] Initializing Razorpay sync...');
    try {
        await syncService.syncAll();
    } catch (e) {
        console.error('[Startup] Initial sync failed:', e.message);
    }

    // 2. Schedule Periodic Sync (Every 6 hours)
    cron.schedule('0 */6 * * *', async () => {
        console.log('[Cron] Running scheduled Razorpay sync...');
        await syncService.syncAll();
    });
    console.log('[Cron] Scheduled sync job: Every 6 hours');
});
