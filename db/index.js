/**
 * Database Factory
 * Selects and initializes the appropriate database adapter based on environment
 */

const path = require('path');
const SQLiteAdapter = require('./adapters/sqlite');
const PostgresAdapter = require('./adapters/postgres');
const { initializeDatabase } = require('./migrate');
const errorLogger = require('./errorLogger');

// Configuration
const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const IS_DEV = process.env.APP_ENV === 'dev';

// SQLite paths
const DB_FILE = IS_DEV ? 'database_dev.sqlite' : 'database.sqlite';
const DB_PATH = path.resolve(__dirname, '..', DB_FILE);

// PostgreSQL connection
const PG_CONNECTION = process.env.DB_CONNECTION_STRING || process.env.DATABASE_URL;

let dbInstance = null;
let isInitialized = false;

/**
 * Get or create database instance
 */
async function getDatabase() {
    if (dbInstance && isInitialized) {
        return dbInstance;
    }

    console.log(`[DB] Initializing ${DB_TYPE} database (Env: ${process.env.APP_ENV || 'prod'})`);

    try {
        if (DB_TYPE === 'sqlite') {
            dbInstance = new SQLiteAdapter(DB_PATH);
            await dbInstance.connect();
        } else if (DB_TYPE === 'postgres') {
            if (!PG_CONNECTION) {
                throw new Error('DB_CONNECTION_STRING is required for PostgreSQL');
            }
            dbInstance = new PostgresAdapter(PG_CONNECTION);
            await dbInstance.connect();
        } else {
            throw new Error(`Unsupported DB_TYPE: ${DB_TYPE}`);
        }

        // Initialize error logger with db instance
        errorLogger.init(dbInstance);

        // Run migrations and seed data
        await initializeDatabase(dbInstance);

        isInitialized = true;
        console.log(`[DB] ${DB_TYPE} initialization complete`);

        return dbInstance;
    } catch (err) {
        console.error('[DB] Initialization failed:', err.message);
        throw err;
    }
}

/**
 * Get sync database instance (for backward compatibility)
 * Returns the raw underlying db object
 */
function getDatabaseSync() {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call getDatabase() first.');
    }
    return dbInstance.getRaw ? dbInstance.getRaw() : dbInstance;
}

/**
 * Close database connection
 */
async function closeDatabase() {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
        isInitialized = false;
    }
}

/**
 * Health check
 */
async function isHealthy() {
    if (!dbInstance) return false;
    return await dbInstance.ping();
}

// Export for CommonJS compatibility
module.exports = {
    getDatabase,
    getDatabaseSync,
    closeDatabase,
    isHealthy,
    DB_TYPE,
    IS_DEV
};

// Also set up a promise for direct access
module.exports.ready = getDatabase();
