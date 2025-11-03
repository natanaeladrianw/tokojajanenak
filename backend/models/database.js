const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

const pool = mysql.createPool(dbConfig);

// Simple connectivity self-check on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ Database connected:', {
      host: dbConfig.host,
      database: dbConfig.database,
      port: dbConfig.port
    });
  } catch (err) {
    console.error('❌ Database connection failed. Check your .env configuration.', {
      host: dbConfig.host,
      database: dbConfig.database,
      port: dbConfig.port,
      error: err.message
    });
  }
})();

module.exports = pool;