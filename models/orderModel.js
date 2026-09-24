// ============================================
// Order Model - all DB queries for `orders` & `order_items`
// ============================================
const db = require('../config/db');

const OrderModel = {
    // Create an order with its line items (transactional)
    // paymentMethod: 'cod' | 'online'
    // For 'online' orders, pass razorpayOrderId so it's linked from the start;
    // payment_status stays 'pending' until verifyPayment() confirms it.
    async create(userId, items, totalAmount, deliveryAddress = null, paymentMethod = 'cod', razorpayOrderId = null) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [orderResult] = await conn.query(
                `INSERT INTO orders (user_id, total_amount, delivery_address, payment_method, razorpay_order_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, totalAmount, deliveryAddress, paymentMethod, razorpayOrderId]
            );
            const orderId = orderResult.insertId;

            for (const item of items) {
                await conn.query(
                    `INSERT INTO order_items (order_id, menu_item_id, item_name, item_price, quantity)
                     VALUES (?, ?, ?, ?, ?)`,
                    [orderId, item.id, item.name, item.price, item.quantity]
                );
            }

            await conn.commit();
            return orderId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    // Mark an online order as successfully paid (after Razorpay signature verification)
    async markPaymentPaid(orderId, razorpayPaymentId) {
        await db.query(
            "UPDATE orders SET payment_status = 'paid', razorpay_payment_id = ? WHERE id = ?",
            [razorpayPaymentId, orderId]
        );
        return true;
    },

    // Mark an online order's payment as failed (e.g. signature mismatch, or payment.failed webhook)
    async markPaymentFailed(orderId) {
        await db.query("UPDATE orders SET payment_status = 'failed' WHERE id = ?", [orderId]);
        return true;
    },

    // Fetch an order by its Razorpay order id (used during payment verification)
    async findByRazorpayOrderId(razorpayOrderId) {
        const [rows] = await db.query(
            'SELECT * FROM orders WHERE razorpay_order_id = ? LIMIT 1',
            [razorpayOrderId]
        );
        return rows[0] || null;
    },

    // Get one order (with items) — used for bill/receipt view
    async findByIdWithItems(orderId) {
        const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
        if (!orderRows[0]) return null;

        const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
        return { ...orderRows[0], items };
    },

    // All orders for a specific customer (order history)
    async findByUser(userId) {
        const [rows] = await db.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    },

    // ---- Admin ----
    async getAllForAdmin(statusFilter = null) {
        if (statusFilter && statusFilter !== 'all') {
            const [rows] = await db.query(
                `SELECT o.*, u.name AS customer_name, u.email AS customer_email
                 FROM orders o JOIN users u ON u.id = o.user_id
                 WHERE o.status = ?
                 ORDER BY o.created_at DESC`,
                [statusFilter]
            );
            return rows;
        }
        const [rows] = await db.query(
            `SELECT o.*, u.name AS customer_name, u.email AS customer_email
             FROM orders o JOIN users u ON u.id = o.user_id
             ORDER BY o.created_at DESC`
        );
        return rows;
    },

    async updateStatus(orderId, status) {
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        return true;
    },

    // ---- Analytics (for admin dashboard) ----
    async getTotalRevenue() {
        const [rows] = await db.query(
            "SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE status != 'cancelled'"
        );
        return rows[0].revenue;
    },

    async getTotalOrders() {
        const [rows] = await db.query('SELECT COUNT(*) AS total FROM orders');
        return rows[0].total;
    },

    async getOrderCountsByStatus() {
        const [rows] = await db.query(
            'SELECT status, COUNT(*) AS count FROM orders GROUP BY status'
        );
        return rows;
    },

    async getRecentOrders(limit = 5) {
        const [rows] = await db.query(
            `SELECT o.*, u.name AS customer_name
             FROM orders o JOIN users u ON u.id = o.user_id
             ORDER BY o.created_at DESC LIMIT ?`,
            [limit]
        );
        return rows;
    },

    async getRevenueLast7Days() {
        const [rows] = await db.query(
            `SELECT DATE(created_at) AS day, COALESCE(SUM(total_amount), 0) AS revenue
             FROM orders
             WHERE status != 'cancelled' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
             GROUP BY DATE(created_at)
             ORDER BY day ASC`
        );
        return rows;
    }
};

module.exports = OrderModel;
