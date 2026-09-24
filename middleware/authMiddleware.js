// ============================================
// Auth Middleware (JWT-based, cookie-stored)
// ============================================
const { verifyToken } = require('../utils/jwt');

// Reads the JWT from the httpOnly cookie (if present & valid) and attaches
// the decoded user to req.user. Runs on every request, before routes.
function attachUserToLocals(req, res, next) {
    const token = req.cookies ? req.cookies.token : null;
    const decoded = token ? verifyToken(token) : null;

    req.user = decoded || null;
    res.locals.currentUser = decoded || null;
    next();
}

// Must be logged in (any role) to access the route
function isAuthenticated(req, res, next) {
    if (req.user) {
        return next();
    }
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
}

// Must be logged in AND role = customer (blocks admin accounts from
// customer-only actions like cart/checkout/order history)
function isCustomer(req, res, next) {
    if (req.user && req.user.role === 'customer') {
        return next();
    }
    if (req.user && req.user.role === 'admin') {
        req.flash('error', 'Admin accounts cannot place orders. Please use a customer account.');
        return res.redirect('/admin/dashboard');
    }
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
}

// Must be logged in AND role = admin
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    req.flash('error', 'Admin access only. Please log in as admin.');
    return res.redirect('/admin/login');
}

// If already logged in, skip login/signup pages
function redirectIfAuthenticated(req, res, next) {
    if (req.user) {
        if (req.user.role === 'admin') return res.redirect('/admin/dashboard');
        return res.redirect('/');
    }
    return next();
}

module.exports = { isAuthenticated, isCustomer, isAdmin, redirectIfAuthenticated, attachUserToLocals };
