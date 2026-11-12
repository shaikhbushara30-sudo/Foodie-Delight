
const { verifyToken, COOKIE_NAME } = require('../utils/jwt');
const IS_ADMIN_APP = process.env.APP_MODE === 'admin';
function attachUserToLocals(req, res, next) {
    const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
    let decoded = token ? verifyToken(token) : null;

    if (decoded) {
        const isAdminToken = decoded.role === 'admin';
        if (IS_ADMIN_APP !== isAdminToken) decoded = null;
    }

    req.user = decoded || null;
    res.locals.currentUser = decoded || null;
    next();
}

function isAuthenticated(req, res, next) {
    if (req.user) {
        return next();
    }
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
}


function isCustomer(req, res, next) {
    if (req.user && req.user.role === 'customer') {
        return next();
    }
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
}


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