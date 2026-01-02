/**
 * SQLite Adapter
 * Promise-based wrapper around sqlite3 for consistent API
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLiteAdapter {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = null;
        this.isConnected = false;
        this.type = 'sqlite';
    }

    /**
     * Initialize the connection
     */
    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('[SQLite] Connection failed:', err.message);
                    reject(err);
                } else {
                    this.isConnected = true;
                    console.log(`[SQLite] Connected to ${path.basename(this.dbPath)}`);

                    // Enable WAL mode and busy timeout for robustness
                    this.db.configure('busyTimeout', 3000);
                    this.db.run("PRAGMA journal_mode = WAL;", (err) => {
                        if (err) console.error("[SQLite] Failed to enable WAL:", err);
                        else console.log("[SQLite] WAL mode enabled");
                    });

                    resolve(this);
                }
            });
        });
    }

    /**
     * Execute a query that modifies data (INSERT, UPDATE, DELETE)
     * Returns { lastID, changes }
     */
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not connected'));

            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * Get a single row
     */
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not connected'));

            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Get all rows
     */
    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not connected'));

            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * Execute multiple statements in sequence (for migrations)
     */
    async exec(sql) {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not connected'));

            this.db.exec(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Run statements in a serialized manner
     */
    serialize(callback) {
        if (!this.db) throw new Error('Database not connected');
        this.db.serialize(callback);
    }

    /**
     * Prepare a statement (for batch inserts)
     */
    prepare(sql) {
        if (!this.db) throw new Error('Database not connected');
        return this.db.prepare(sql);
    }

    /**
     * Close the connection
     */
    async close() {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve();

            this.db.close((err) => {
                if (err) reject(err);
                else {
                    this.isConnected = false;
                    console.log('[SQLite] Connection closed');
                    resolve();
                }
            });
        });
    }

    /**
     * Health check
     */
    async ping() {
        try {
            await this.get("SELECT 1");
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get raw db instance (for backward compatibility)
     */
    getRaw() {
        return this.db;
    }

    // Compatibility aliases for older scripts
    async getAsync(sql, params = []) { return this.get(sql, params); }
    async allAsync(sql, params = []) { return this.all(sql, params); }
    async runAsync(sql, params = []) { return this.run(sql, params); }
}

module.exports = SQLiteAdapter;
