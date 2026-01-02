/**
 * Database Migration Runner - PostgreSQL
 * Applies schema migrations in order
 */

const { TABLES, SEEDS, CURRENT_VERSION } = require('./schema');

/**
 * Initialize the database with all tables and seed data
 * @param {object} db - Database adapter instance
 */
async function initializeDatabase(db) {
    console.log('[Migrate] Initializing database...');

    // Create all tables
    for (const [name, sql] of Object.entries(TABLES)) {
        try {
            await db.runAsync(sql);
            console.log(`[Migrate] ✓ Table '${name}' ready`);
        } catch (err) {
            console.error(`[Migrate] ✗ Failed to create '${name}':`, err.message);
            throw err;
        }
    }

    // Check and run migrations
    await runMigrations(db);

    // Seed default data
    await seedDefaults(db);

    console.log('[Migrate] Database initialization complete');
}

/**
 * Run pending migrations
 */
async function runMigrations(db) {
    // Check if schema_version table has description column
    try {
        const cols = await db.allAsync(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'schema_version'
        `);
        const hasDescription = cols.some(c => c.column_name === 'description');
        if (!hasDescription) {
            console.log('[Migrate] Adding missing column "description" to schema_version...');
            await db.runAsync('ALTER TABLE schema_version ADD COLUMN description TEXT');
        }
    } catch (err) {
        // Table might not exist yet if it's a first run
    }

    // Get current version
    let currentVersion = 0;
    try {
        const row = await db.getAsync('SELECT MAX(version) as version FROM schema_version');
        currentVersion = row?.version || 0;
    } catch (err) {
        // Table doesn't exist yet, version is 0
        currentVersion = 0;
    }

    console.log(`[Migrate] Current schema version: ${currentVersion}`);

    if (currentVersion >= CURRENT_VERSION) {
        console.log('[Migrate] Schema is up to date');
        return;
    }

    // Run migrations from currentVersion+1 to CURRENT_VERSION
    for (let v = currentVersion + 1; v <= CURRENT_VERSION; v++) {
        try {
            await applyMigration(db, v);
            await db.runAsync(
                'INSERT INTO schema_version (version, description) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
                [v, `Migration to version ${v}`]
            );
            console.log(`[Migrate] ✓ Applied migration v${v}`);
        } catch (err) {
            console.error(`[Migrate] ✗ Migration v${v} failed:`, err.message);
            throw err;
        }
    }
}

/**
 * Apply specific migration
 */
async function applyMigration(db, version) {
    switch (version) {
        case 1:
            // Initial schema - tables already created above
            break;

        case 2:
            // Add address fields to users table
            console.log('[Migrate] Adding address fields to users table...');
            const columnsToAdd = [
                { name: 'gstin', type: 'TEXT' },
                { name: 'theme', type: 'TEXT' },
                { name: 'address', type: 'TEXT' },
                { name: 'city', type: 'TEXT' },
                { name: 'state', type: 'TEXT' },
                { name: 'pincode', type: 'TEXT' }
            ];

            const existingCols = await db.allAsync(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users'
            `);
            const existingNames = existingCols.map(c => c.column_name);

            for (const col of columnsToAdd) {
                if (!existingNames.includes(col.name)) {
                    try {
                        await db.runAsync(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
                        console.log(`[Migrate] ✓ Added column 'users.${col.name}'`);
                    } catch (err) {
                        if (!err.message.includes('already exists')) {
                            console.warn(`[Migrate] Column ${col.name} may already exist: ${err.message}`);
                        }
                    }
                }
            }
            break;

        case 3:
            // Email templates table is created by the main loop
            console.log('[Migrate] v3 migration: email_templates table ready.');
            break;

        case 4:
            // Add renewal_date to subscriptions
            console.log('[Migrate] Adding renewal_date to subscriptions table...');
            try {
                const subCols = await db.allAsync(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'subscriptions'
                `);
                if (!subCols.some(c => c.column_name === 'renewal_date')) {
                    await db.runAsync('ALTER TABLE subscriptions ADD COLUMN renewal_date TIMESTAMP');
                    console.log('[Migrate] ✓ Added column "subscriptions.renewal_date"');
                }
            } catch (err) {
                if (!err.message.includes('already exists')) {
                    console.warn(`[Migrate] Could not add renewal_date: ${err.message}`);
                }
            }
            break;

        case 5:
            // PostgreSQL Migration - nothing to do, schema created fresh
            console.log('[Migrate] v5 migration: PostgreSQL migration complete.');
            break;

        case 6:
            // Add price_color column to plans table
            console.log('[Migrate] Adding price_color column to plans table...');
            try {
                const planCols = await db.allAsync(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'plans'
                `);
                if (!planCols.some(c => c.column_name === 'price_color')) {
                    await db.runAsync('ALTER TABLE plans ADD COLUMN price_color TEXT');
                    console.log('[Migrate] ✓ Added column "plans.price_color"');
                }
            } catch (err) {
                if (!err.message.includes('already exists')) {
                    console.warn(`[Migrate] Could not add price_color: ${err.message}`);
                }
            }
            break;

        default:
            console.log(`[Migrate] No migration defined for v${version}`);
    }
}

/**
 * Seed default data if tables are empty
 */
async function seedDefaults(db) {
    // Seed settings - ensure each individual key exists
    console.log('[Migrate] Checking default settings...');
    for (const [key, value] of Object.entries(SEEDS.settings)) {
        const existing = await db.getAsync('SELECT value FROM settings WHERE key = $1', [key]);
        if (!existing || existing.value === '' || existing.value === null) {
            console.log(`[Migrate] Seeding/Backfilling setting: ${key}`);
            await db.runAsync(
                'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                [key, value]
            );
        }
    }

    // Seed categories
    const catCount = await db.getAsync('SELECT COUNT(*) as count FROM categories');
    if (parseInt(catCount?.count) === 0) {
        console.log('[Migrate] Seeding default categories...');
        for (const cat of SEEDS.categories) {
            await db.runAsync(
                'INSERT INTO categories (id, name, display_order, icon, tagline) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
                [cat.id, cat.name, cat.display_order, cat.icon, cat.tagline]
            );
        }
    }

    // Seed email templates
    const templateCount = await db.getAsync('SELECT COUNT(*) as count FROM email_templates');
    if (parseInt(templateCount?.count) === 0) {
        console.log('[Migrate] Seeding default email templates...');
        for (const t of SEEDS.email_templates) {
            await db.runAsync(
                'INSERT INTO email_templates (id, name, subject, body) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                [t.id, t.name, t.subject, t.body]
            );
        }
    }
}

/**
 * Reset database (DANGEROUS - dev only)
 */
async function resetDatabase(db) {
    if (process.env.APP_ENV !== 'dev') {
        throw new Error('Database reset is only allowed in dev mode');
    }

    console.log('[Migrate] RESETTING DATABASE...');

    // Drop all tables in reverse order
    const tableNames = Object.keys(TABLES).reverse();
    for (const name of tableNames) {
        await db.runAsync(`DROP TABLE IF EXISTS ${name} CASCADE`);
        console.log(`[Migrate] Dropped table '${name}'`);
    }

    // Reinitialize
    await initializeDatabase(db);
}

module.exports = {
    initializeDatabase,
    runMigrations,
    seedDefaults,
    resetDatabase,
    CURRENT_VERSION
};
