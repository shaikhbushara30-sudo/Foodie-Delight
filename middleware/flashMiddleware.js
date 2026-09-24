// ============================================
// Cookie-based Flash Messages (replaces connect-flash)
// No session needed — the message is stored in a short-lived cookie,
// read once on the next request, then cleared.
// ============================================

function flashMiddleware(req, res, next) {
    let flashData = {};
    if (req.cookies && req.cookies.flash) {
        try {
            flashData = JSON.parse(req.cookies.flash);
        } catch (e) {
            flashData = {};
        }
        res.clearCookie('flash');
    }

    res.locals.success = flashData.success ? [flashData.success] : [];
    res.locals.error = flashData.error ? [flashData.error] : [];

    // Mimic connect-flash's req.flash(type, message) API used throughout the controllers
    req.flash = function (type, message) {
        res.cookie('flash', JSON.stringify({ [type]: message }), {
            maxAge: 5000, // only needs to survive until the very next request
            httpOnly: true
        });
    };

    next();
}

module.exports = flashMiddleware;
