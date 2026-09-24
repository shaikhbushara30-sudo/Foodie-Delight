const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const dashboardController = require('../controllers/admin/dashboardController');
const adminMenuController = require('../controllers/admin/menuController');
const adminOrderController = require('../controllers/admin/orderController');
const adminMessageController = require('../controllers/admin/messageController');
const { isAdmin, redirectIfAuthenticated } = require('../middleware/authMiddleware');

// Admin auth
router.get('/login', redirectIfAuthenticated, authController.showAdminLogin);
router.post('/login', redirectIfAuthenticated, authController.adminLogin);

// Dashboard
router.get('/dashboard', isAdmin, dashboardController.index);

// Menu CRUD
router.get('/menu', isAdmin, adminMenuController.list);
router.get('/menu/add', isAdmin, adminMenuController.showAddForm);
router.post('/menu/add', isAdmin, adminMenuController.add);
router.get('/menu/edit/:id', isAdmin, adminMenuController.showEditForm);
router.post('/menu/edit/:id', isAdmin, adminMenuController.edit);
router.post('/menu/delete/:id', isAdmin, adminMenuController.delete);

// Orders
router.get('/orders', isAdmin, adminOrderController.list);
router.get('/orders/:id', isAdmin, adminOrderController.detail);
router.post('/orders/:id/status', isAdmin, adminOrderController.updateStatus);

// Contact messages
router.get('/messages', isAdmin, adminMessageController.list);
router.post('/messages/:id/read', isAdmin, adminMessageController.markRead);
router.post('/messages/:id/delete', isAdmin, adminMessageController.delete);

module.exports = router;
