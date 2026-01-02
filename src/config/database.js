/**
 * PostgreSQL Database Configuration
 * Replaces SQLite with PostgreSQL using connection pooling
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Determine if we're in development mode
const isDev = process.env.APP_ENV === 'dev';

// Get database URL from environment
// Priority: DATABASE_URL (Coolify/aaPanel inject this) > DEV/PROD specific
const connectionString =
  process.env.DATABASE_URL ||  // Coolify/aaPanel will set this directly
  (isDev ? process.env.DATABASE_URL_DEV : process.env.DATABASE_URL_PROD);

if (!connectionString) {
  console.error('[DB] ERROR: DATABASE_URL not configured');
  console.error('[DB] For dev: Set DATABASE_URL_DEV in .env');
  console.error('[DB] For prod: Set DATABASE_URL in Coolify/aaPanel environment');
  process.exit(1);
}

console.log(`[DB] Connecting to PostgreSQL (Mode: ${isDev ? 'DEV' : 'PROD'})`);

// Create connection pool
const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 10, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

// Create a db object that mimics the SQLite interface for compatibility
const db = {
  // Core pool reference
  pool,

  /**
   * Execute a query and return all rows
   * @param {string} sql - SQL query with $1, $2, ... placeholders
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Array of rows
   */
  async allAsync(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows;
  },

  /**
   * Execute a query and return the first row
   * @param {string} sql - SQL query with $1, $2, ... placeholders
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|undefined>} First row or undefined
   */
  async getAsync(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows[0];
  },

  /**
   * Execute a query (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL query with $1, $2, ... placeholders
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Result with rowCount and (for INSERT) returning id
   */
  async runAsync(sql, params = []) {
    const result = await pool.query(sql, params);
    return {
      rowCount: result.rowCount,
      changes: result.rowCount,
      lastID: result.rows[0]?.id, // Works with RETURNING id clause
      rows: result.rows,
    };
  },

  // Callback-based methods for backward compatibility
  all(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    pool.query(sql, params)
      .then(result => callback(null, result.rows))
      .catch(err => callback(err));
  },

  get(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    pool.query(sql, params)
      .then(result => callback(null, result.rows[0]))
      .catch(err => callback(err));
  },

  run(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    pool.query(sql, params)
      .then(result => {
        // Mimic SQLite's this.lastID and this.changes
        const context = {
          lastID: result.rows[0]?.id,
          changes: result.rowCount,
        };
        if (callback) callback.call(context, null);
      })
      .catch(err => {
        if (callback) callback(err);
      });
  },

  /**
   * Execute a raw query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Full query result
   */
  async query(sql, params = []) {
    return pool.query(sql, params);
  },

  /**
   * Get a client from the pool for transactions
   * @returns {Promise<Object>} Client with release method
   */
  async getClient() {
    return pool.connect();
  },

  /**
   * Close all connections
   */
  async close() {
    await pool.end();
    console.log('[DB] All connections closed');
  },
};

// Initialize database (create tables and run migrations)
const initializeDatabase = async () => {
  try {
    const { initializeDatabase: runMigrations } = require('../../db/migrate');
    await runMigrations(db);
    console.log('[DB] Initialization and migrations successful');
  } catch (err) {
    console.error('[DB] Migration failure:', err);
    throw err;
  }
};

// Run initialization
initializeDatabase();

module.exports = db;
