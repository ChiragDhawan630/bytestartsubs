/**
 * PostgreSQL Adapter (Stub)
 * Placeholder for future PostgreSQL support
 * Implements same interface as SQLiteAdapter
 */

class PostgresAdapter {
    constructor(connectionString) {
        this.connectionString = connectionString;
        this.client = null;
        this.isConnected = false;
        this.type = 'postgres';
    }

    async connect() {
        // TODO: Implement with 'pg' package
        // const { Client } = require('pg');
        // this.client = new Client({ connectionString: this.connectionString });
        // await this.client.connect();
        throw new Error('PostgreSQL adapter not yet implemented. Please use DB_TYPE=sqlite');
    }

    async run(sql, params = []) {
        throw new Error('PostgreSQL adapter not yet implemented');
    }

    async get(sql, params = []) {
        throw new Error('PostgreSQL adapter not yet implemented');
    }

    async all(sql, params = []) {
        throw new Error('PostgreSQL adapter not yet implemented');
    }

    async exec(sql) {
        throw new Error('PostgreSQL adapter not yet implemented');
    }

    async close() {
        if (this.client) {
            await this.client.end();
            this.isConnected = false;
        }
    }

    async ping() {
        try {
            await this.get("SELECT 1");
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = PostgresAdapter;
