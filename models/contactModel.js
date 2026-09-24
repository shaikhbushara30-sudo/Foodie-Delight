// ============================================
// Contact Model - all DB queries for `contact_messages`
// ============================================
const db = require('../config/db');

const ContactModel = {
    async create({ name, email, message }) {
        const [result] = await db.query(
            'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
            [name, email, message]
        );
        return result.insertId;
    },

    async getAll() {
        const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        return rows;
    },

    async markAsRead(id) {
        await db.query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [id]);
        return true;
    },

    async delete(id) {
        await db.query('DELETE FROM contact_messages WHERE id = ?', [id]);
        return true;
    },

    async countUnread() {
        const [rows] = await db.query('SELECT COUNT(*) AS total FROM contact_messages WHERE is_read = 0');
        return rows[0].total;
    }
};

module.exports = ContactModel;
