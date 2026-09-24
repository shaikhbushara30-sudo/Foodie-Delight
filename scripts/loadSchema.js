// ============================================
// Load database/schema.sql using Node.js directly
// Use this if the `mysql` command isn't available in your terminal's PATH.
// Run with: node scripts/loadSchema.js
// Reads DB_HOST / DB_USER / DB_PASSWORD from .env (DB_NAME is NOT required
// here, since this script creates the database itself from schema.sql)
// ============================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function loadSchema() {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const rawSql = fs.readFileSync(schemaPath, 'utf8');

    // Strip full-line SQL comments first, then split the remaining text into
    // individual statements. This avoids the bug of accidentally dropping
    // real CREATE TABLE / INSERT statements that happen to start right after
    // a comment block.
    const withoutComments = rawSql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');

    const statements = withoutComments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            connectTimeout: 20000,
            multipleStatements: false
        });

        console.log('✅ Connected to MySQL server');
        console.log(`⏳ Running schema.sql (${statements.length} statements)...`);

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            try {
                await connection.query(stmt);
            } catch (stmtErr) {
                console.error(`❌ Statement ${i + 1} failed:\n   ${stmt.slice(0, 80)}...`);
                throw stmtErr;
            }
        }

        console.log('✅ Database "foodie_delight" created successfully with all tables and seed data!');
        console.log('   Next step: run  npm run seed:admin');
    } catch (err) {
        console.error('❌ Failed to load schema.');
        console.error('   Error code:', err.code || '(none)');
        console.error('   Error message:', err.message || '(empty)');
        console.error('   Error errno:', err.errno || '(none)');
        console.error('   SQL message:', err.sqlMessage || '(none)');
        console.error('   Check your .env DB_HOST/DB_USER/DB_PASSWORD values.');
        console.error('\n   Full error object below for debugging:');
        console.error(err);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

loadSchema();
