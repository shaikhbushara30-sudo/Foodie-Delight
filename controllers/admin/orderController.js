// ============================================
// Admin Order Controller - view & update order status
// ============================================
const OrderModel = require('../../models/orderModel');

const VALID_STATUSES = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const adminOrderController = {
    // GET /admin/orders?status=pending
    async list(req, res) {
        try {
            const status = req.query.status || 'all';
            const orders = await OrderModel.getAllForAdmin(status);
            res.render('admin/orders', { title: 'Manage Orders', layout: false, orders, activeStatus: status, statuses: VALID_STATUSES });
        } catch (err) {
            console.error('Admin orders list error:', err);
            res.render('admin/orders', { title: 'Manage Orders', layout: false, orders: [], activeStatus: 'all', statuses: VALID_STATUSES });
        }
    },

    // GET /admin/orders/:id
    async detail(req, res) {
        try {
            const order = await OrderModel.findByIdWithItems(req.params.id);
            if (!order) {
                req.flash('error', 'Order not found.');
                return res.redirect('/admin/orders');
            }
            res.render('admin/order-detail', { title: `Order #${order.id}`, layout: false, order, statuses: VALID_STATUSES });
        } catch (err) {
            console.error('Admin order detail error:', err);
            res.redirect('/admin/orders');
        }
    },

    // POST /admin/orders/:id/status
    async updateStatus(req, res) {
        try {
            const { status } = req.body;
            if (!VALID_STATUSES.includes(status)) {
                req.flash('error', 'Invalid status.');
                return res.redirect(`/admin/orders/${req.params.id}`);
            }
            await OrderModel.updateStatus(req.params.id, status);
            req.flash('success', 'Order status updated.');
            res.redirect(`/admin/orders/${req.params.id}`);
        } catch (err) {
            console.error('Admin order status update error:', err);
            req.flash('error', 'Failed to update order status.');
            res.redirect('/admin/orders');
        }
    }
};

module.exports = adminOrderController;
