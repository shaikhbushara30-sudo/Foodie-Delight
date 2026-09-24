// ============================================
// MySQL Database Connection (mysql2 pool)
// ============================================
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'foodie_delight',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Quick connectivity check on startup (non-fatal, just logs)
(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('✅ MySQL database connected successfully');
        conn.release();
    } catch (err) {
        console.error('❌ MySQL connection failed:', err.message);
        console.error('   Check your .env DB_HOST/DB_USER/DB_PASSWORD/DB_NAME values.');
    }
})();

module.exports = pool;
