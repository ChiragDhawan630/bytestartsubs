const db = require('../config/database');

const logActivity = async (userId, action, details) => {
  try {
    await db.runAsync(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, action, details]
    );
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

const logError = async (error, context = {}, type = 'system') => {
  const message = error.message || String(error);
  const stack = error.stack || '';
  const contextStr = JSON.stringify(context);

  try {
    await db.runAsync(
      'INSERT INTO error_logs (message, stack, error_type, context) VALUES ($1, $2, $3, $4)',
      [message, stack, type, contextStr]
    );
  } catch (err) {
    console.error("Failed to log error to DB:", err.message);
  }
};

module.exports = { logActivity, logError };
