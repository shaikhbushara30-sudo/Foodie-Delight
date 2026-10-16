// ============================================
// JWT Helper - sign & verify auth tokens
// ============================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'foodie_delight_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // stays logged in for 7 days

function signToken(user) {
    // Only put non-sensitive fields in the token payload
    return jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null; // invalid or expired token
    }
}

// The user site and the admin site use DIFFERENT cookie names, so a login on one
// can never be read by the other (cookies are shared across ports on localhost).
const COOKIE_NAME = process.env.APP_MODE === 'admin' ? 'admin_token' : 'token';

module.exports = { signToken, verifyToken, COOKIE_NAME };