// ============================================
// Razorpay Config - initializes the Razorpay SDK instance
// using the Key ID / Key Secret from .env
// ============================================
require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = razorpay;
