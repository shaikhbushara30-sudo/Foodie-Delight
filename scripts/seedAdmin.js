// ============================================
// Seed / reset the default admin account
// Run with: npm run seed:admin
// Uses ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env
// ============================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seedAdmin() {
    const name = process.env.ADMIN_NAME || 'Admin';
    const email = process.env.ADMIN_EMAIL || 'admin@foodiedelight.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

        if (existing.length > 0) {
            await db.query('UPDATE users SET password = ?, role = ? WHERE email = ?', [hashedPassword, 'admin', email]);
            console.log(`✅ Existing admin updated: ${email}`);
        } else {
            await db.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, 'admin']
            );
            console.log(`✅ Admin account created: ${email}`);
        }

        console.log(`   Login at /admin/login with:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to seed admin:', err.message);
        process.exit(1);
    }
}

seedAdmin();
