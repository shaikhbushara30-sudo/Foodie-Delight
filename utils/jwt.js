
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'foodie_delight_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // stays logged in for 7 days

function signToken(user) {
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


const COOKIE_NAME = process.env.APP_MODE === 'admin' ? 'admin_token' : 'token';

module.exports = { signToken, verifyToken, COOKIE_NAME };