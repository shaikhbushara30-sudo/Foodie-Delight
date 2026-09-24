const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isCustomer } = require('../middleware/authMiddleware');

// Cart page (client-side cart, server just renders the shell)
// isCustomer ensures logged-in ADMIN accounts can't accidentally shop/checkout
router.get('/cart', isCustomer, (req, res) => {
    res.render('cart', { title: 'Your Cart' });
});

// Checkout API (called via fetch from cart.ejs client JS)
router.post('/order/checkout', isCustomer, orderController.checkout);

// Razorpay online payment flow
router.post('/order/razorpay/create', isCustomer, orderController.createRazorpayOrder);
router.post('/order/razorpay/verify', isCustomer, orderController.verifyRazorpayPayment);

// Order history + bill view
router.get('/orders/my', isCustomer, orderController.myOrders);
router.get('/orders/:id/bill', isCustomer, orderController.viewBill);

module.exports = router;
