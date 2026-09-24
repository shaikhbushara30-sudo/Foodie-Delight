// ============================================
// Admin Dashboard Controller - analytics overview
// ============================================
const OrderModel = require('../../models/orderModel');
const UserModel = require('../../models/userModel');
const MenuModel = require('../../models/menuModel');
const ContactModel = require('../../models/contactModel');

const dashboardController = {
    // GET /admin/dashboard
    async index(req, res) {
        try {
            const [
                totalRevenue,
                totalOrders,
                totalCustomers,
                statusCounts,
                recentOrders,
                topSelling,
                unreadMessages,
                revenue7Days
            ] = await Promise.all([
                OrderModel.getTotalRevenue(),
                OrderModel.getTotalOrders(),
                UserModel.countCustomers(),
                OrderModel.getOrderCountsByStatus(),
                OrderModel.getRecentOrders(5),
                MenuModel.getTopSelling(5),
                ContactModel.countUnread(),
                OrderModel.getRevenueLast7Days()
            ]);

            res.render('admin/dashboard', {
                title: 'Admin Dashboard',
                layout: false,
                totalRevenue,
                totalOrders,
                totalCustomers,
                statusCounts,
                recentOrders,
                topSelling,
                unreadMessages,
                revenue7Days
            });
        } catch (err) {
            console.error('Admin dashboard error:', err);
            res.render('admin/dashboard', {
                title: 'Admin Dashboard',
                layout: false,
                totalRevenue: 0,
                totalOrders: 0,
                totalCustomers: 0,
                statusCounts: [],
                recentOrders: [],
                topSelling: [],
                unreadMessages: 0,
                revenue7Days: []
            });
        }
    }
};

module.exports = dashboardController;
