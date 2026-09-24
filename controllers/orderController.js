// ============================================
// Order Controller - checkout (COD + Razorpay online), bill, order history
// ============================================
const crypto = require('crypto');
const OrderModel = require('../models/orderModel');
const MenuModel = require('../models/menuModel');
const razorpay = require('../config/razorpay');

// Re-fetches real prices from the DB for the given cart items and computes
// the total. Never trusts prices sent from the client — only id + quantity.
async function validateCartAndComputeTotal(items) {
    const ids = items.map(i => parseInt(i.id, 10));
    const dbItems = await MenuModel.findByIds(ids);

    const orderItems = [];
    let total = 0;

    for (const cartItem of items) {
        const dbItem = dbItems.find(d => d.id === parseInt(cartItem.id, 10));
        if (!dbItem) continue;
        const quantity = Math.max(1, parseInt(cartItem.quantity, 10) || 1);
        const price = parseFloat(dbItem.price);
        total += price * quantity;
        orderItems.push({ id: dbItem.id, name: dbItem.name, price, quantity });
    }

    return { orderItems, total };
}

const orderController = {
    // POST /order/checkout  (Cash on Delivery — called via fetch from the cart page)
    // body: { items: [{ id, quantity }], deliveryAddress }
    async checkout(req, res) {
        try {
            const { items, deliveryAddress } = req.body;
            const userId = req.user.id;

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ success: false, message: 'Your cart is empty.' });
            }

            const { orderItems, total } = await validateCartAndComputeTotal(items);

            if (orderItems.length === 0) {
                return res.status(400).json({ success: false, message: 'No valid items in cart.' });
            }

            const orderId = await OrderModel.create(
                userId, orderItems, total.toFixed(2), deliveryAddress || null, 'cod'
            );
            const order = await OrderModel.findByIdWithItems(orderId);

            return res.json({ success: true, order });
        } catch (err) {
            console.error('Checkout error:', err);
            return res.status(500).json({ success: false, message: 'Something went wrong during checkout.' });
        }
    },

    // POST /order/razorpay/create  (Online payment — step 1: create a Razorpay order)
    // body: { items: [{ id, quantity }], deliveryAddress }
    async createRazorpayOrder(req, res) {
        try {
            const { items, deliveryAddress } = req.body;
            const userId = req.user.id;

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ success: false, message: 'Your cart is empty.' });
            }

            const { orderItems, total } = await validateCartAndComputeTotal(items);

            if (orderItems.length === 0) {
                return res.status(400).json({ success: false, message: 'No valid items in cart.' });
            }

            // Razorpay expects the amount in the smallest currency unit (paise for INR)
            const amountInPaise = Math.round(total * 100);

            const razorpayOrder = await razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            });

            // Create our own order record right away (payment_status stays 'pending'
            // until verifyPayment confirms it) so nothing is lost if the user
            // closes the payment popup partway through.
            const orderId = await OrderModel.create(
                userId, orderItems, total.toFixed(2), deliveryAddress || null, 'online', razorpayOrder.id
            );

            return res.json({
                success: true,
                orderId,
                razorpayOrderId: razorpayOrder.id,
                amount: amountInPaise,
                currency: 'INR',
                keyId: process.env.RAZORPAY_KEY_ID
            });
        } catch (err) {
            console.error('Razorpay order creation error:', err);
            return res.status(500).json({ success: false, message: 'Could not initiate payment. Please try again.' });
        }
    },

    // POST /order/razorpay/verify  (Online payment — step 2: verify signature after payment)
    // body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    async verifyRazorpayPayment(req, res) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).json({ success: false, message: 'Missing payment details.' });
            }

            const order = await OrderModel.findByRazorpayOrderId(razorpay_order_id);
            if (!order || order.user_id !== req.user.id) {
                return res.status(404).json({ success: false, message: 'Order not found.' });
            }

            // Verify the signature Razorpay sent back — this proves the payment
            // response genuinely came from Razorpay and wasn't forged by the client.
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                await OrderModel.markPaymentFailed(order.id);
                return res.status(400).json({ success: false, message: 'Payment verification failed.' });
            }

            await OrderModel.markPaymentPaid(order.id, razorpay_payment_id);
            const updatedOrder = await OrderModel.findByIdWithItems(order.id);

            return res.json({ success: true, order: updatedOrder });
        } catch (err) {
            console.error('Payment verification error:', err);
            return res.status(500).json({ success: false, message: 'Something went wrong verifying your payment.' });
        }
    },

    // GET /orders/my  (order history for logged-in customer)
    async myOrders(req, res) {
        try {
            const orders = await OrderModel.findByUser(req.user.id);
            res.render('my-orders', { title: 'My Orders', orders });
        } catch (err) {
            console.error('My orders error:', err);
            res.render('my-orders', { title: 'My Orders', orders: [] });
        }
    },

    // GET /orders/:id/bill  (view a single order's bill/receipt)
    async viewBill(req, res) {
        try {
            const order = await OrderModel.findByIdWithItems(req.params.id);
            if (!order || order.user_id !== req.user.id) {
                req.flash('error', 'Order not found.');
                return res.redirect('/orders/my');
            }
            res.render('bill', { title: 'Order Bill', order });
        } catch (err) {
            console.error('View bill error:', err);
            res.redirect('/orders/my');
        }
    }
};

module.exports = orderController;
