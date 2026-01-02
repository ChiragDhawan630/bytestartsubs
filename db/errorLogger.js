/**
 * Error Logger
 * Captures and stores errors in the database for admin monitoring
 */

let dbInstance = null;

/**
 * Initialize error logger with database instance
 */
function init(db) {
    dbInstance = db;
}

/**
 * Log an error to the database
 * @param {string} errorType - 'db', 'api', 'auth', 'payment', 'system'
 * @param {Error|string} error - Error object or message
 * @param {object} context - Additional context (request info, etc.)
 */
async function logError(errorType, error, context = {}) {
    if (!dbInstance) {
        console.error('[ErrorLogger] DB not initialized, falling back to console');
        console.error(`[${errorType}]`, error);
        return;
    }

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : null;
    const contextJson = JSON.stringify(context);

    try {
        await dbInstance.run(
            `INSERT INTO error_logs (error_type, message, stack, context) VALUES (?, ?, ?, ?)`,
            [errorType, message, stack, contextJson]
        );
        console.error(`[ErrorLogger] Logged ${errorType} error: ${message}`);
    } catch (dbError) {
        // Fallback to console if DB insert fails
        console.error('[ErrorLogger] Failed to log to DB:', dbError.message);
        console.error(`[${errorType}]`, message, stack);
    }
}

/**
 * Get recent errors
 * @param {number} limit - Max errors to return
 * @param {string} filter - 'all', 'unresolved', 'resolved'
 */
async function getErrors(limit = 100, filter = 'all') {
    if (!dbInstance) return [];

    let sql = `SELECT * FROM error_logs`;

    if (filter === 'unresolved') {
        sql += ` WHERE resolved = 0`;
    } else if (filter === 'resolved') {
        sql += ` WHERE resolved = 1`;
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;

    return await dbInstance.all(sql, [limit]);
}

/**
 * Mark error as resolved
 */
async function resolveError(id) {
    if (!dbInstance) return;
    await dbInstance.run(`UPDATE error_logs SET resolved = 1 WHERE id = ?`, [id]);
}

/**
 * Delete an error
 */
async function deleteError(id) {
    if (!dbInstance) return;
    await dbInstance.run(`DELETE FROM error_logs WHERE id = ?`, [id]);
}

/**
 * Clear all errors
 */
async function clearAll() {
    if (!dbInstance) return;
    await dbInstance.run(`DELETE FROM error_logs`);
}

/**
 * Get error count
 */
async function getCount(unresolvedOnly = true) {
    if (!dbInstance) return 0;

    const sql = unresolvedOnly
        ? `SELECT COUNT(*) as count FROM error_logs WHERE resolved = 0`
        : `SELECT COUNT(*) as count FROM error_logs`;

    const row = await dbInstance.get(sql);
    return row ? row.count : 0;
}

/**
 * Express middleware to capture unhandled errors
 */
function errorMiddleware() {
    return (err, req, res, next) => {
        logError('api', err, {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            user: req.user?.id
        });

        res.status(err.status || 500).json({
            error: process.env.APP_ENV === 'dev' ? err.message : 'Internal Server Error'
        });
    };
}

module.exports = {
    init,
    logError,
    getErrors,
    resolveError,
    deleteError,
    clearAll,
    getCount,
    errorMiddleware
};
