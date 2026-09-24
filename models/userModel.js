// ============================================
// User Model - all DB queries for `users` table
// ============================================
const db = require('../config/db');

const UserModel = {
    // Find a user by email
    async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        return rows[0] || null;
    },

    // Find a user by id
    async findById(id) {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        return rows[0] || null;
    },

    // Create a new user (default role = customer)
    async create({ name, email, password, phone = null, address = null, role = 'customer' }) {
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, password, phone, address, role]
        );
        return result.insertId;
    },

    // Update a user's profile
    async update(id, { name, phone, address }) {
        await db.query(
            'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
            [name, phone, address, id]
        );
        return true;
    },

    // Count all customers (for admin analytics)
    async countCustomers() {
        const [rows] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'");
        return rows[0].total;
    },

    // List all customers (for admin, if needed)
    async listCustomers() {
        const [rows] = await db.query(
            "SELECT id, name, email, phone, address, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC"
        );
        return rows;
    }
};

module.exports = UserModel;
