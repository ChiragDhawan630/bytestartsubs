const db = require('./src/config/database');

async function checkPlans() {
    try {
        console.log('--- Categories ---');
        const categories = await db.query('SELECT * FROM categories');
        console.table(categories.rows);

        console.log('\n--- Plans ---');
        const plans = await db.query('SELECT * FROM plans');
        console.table(plans.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

// Wait for connection
setTimeout(checkPlans, 1000);
