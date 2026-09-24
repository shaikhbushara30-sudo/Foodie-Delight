// ============================================
// Menu Model - all DB queries for `menu_items` table
// ============================================
const db = require('../config/db');

const MenuModel = {
    // Get all available menu items, optionally filtered by category
    async getAll(category = 'all') {
        if (category && category !== 'all') {
            const [rows] = await db.query(
                'SELECT * FROM menu_items WHERE category = ? AND is_available = 1 ORDER BY id ASC',
                [category]
            );
            return rows;
        }
        const [rows] = await db.query(
            'SELECT * FROM menu_items WHERE is_available = 1 ORDER BY id ASC'
        );
        return rows;
    },

    // Get featured items for homepage
    async getFeatured(limit = 3) {
        const [rows] = await db.query(
            'SELECT * FROM menu_items WHERE is_featured = 1 AND is_available = 1 ORDER BY id ASC LIMIT ?',
            [limit]
        );
        return rows;
    },

    // Get single item by id
    async findById(id) {
        const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ? LIMIT 1', [id]);
        return rows[0] || null;
    },

    // Get multiple items by an array of ids (used to validate cart prices server-side)
    async findByIds(ids) {
        if (!ids.length) return [];
        const placeholders = ids.map(() => '?').join(',');
        const [rows] = await db.query(
            `SELECT * FROM menu_items WHERE id IN (${placeholders})`,
            ids
        );
        return rows;
    },

    // Distinct categories (for menu filter buttons)
    async getCategories() {
        const [rows] = await db.query(
            "SELECT DISTINCT category FROM menu_items WHERE is_available = 1 ORDER BY category ASC"
        );
        return rows.map(r => r.category);
    },

    // ---- Admin CRUD ----
    async getAllForAdmin() {
        const [rows] = await db.query('SELECT * FROM menu_items ORDER BY created_at DESC');
        return rows;
    },

    async create({ name, description, price, category, image, is_featured }) {
        const [result] = await db.query(
            `INSERT INTO menu_items (name, description, price, category, image, is_featured)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description, price, category, image, is_featured ? 1 : 0]
        );
        return result.insertId;
    },

    async update(id, { name, description, price, category, image, is_featured, is_available }) {
        await db.query(
            `UPDATE menu_items
             SET name = ?, description = ?, price = ?, category = ?, image = ?, is_featured = ?, is_available = ?
             WHERE id = ?`,
            [name, description, price, category, image, is_featured ? 1 : 0, is_available ? 1 : 0, id]
        );
        return true;
    },

    async delete(id) {
        await db.query('DELETE FROM menu_items WHERE id = ?', [id]);
        return true;
    },

    // Top-selling items (for admin analytics)
    async getTopSelling(limit = 5) {
        const [rows] = await db.query(
            `SELECT mi.id, mi.name, mi.image, SUM(oi.quantity) AS total_sold
             FROM order_items oi
             JOIN menu_items mi ON mi.id = oi.menu_item_id
             GROUP BY mi.id, mi.name, mi.image
             ORDER BY total_sold DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }
};

module.exports = MenuModel;
