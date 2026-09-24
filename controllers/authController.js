// ============================================
// Auth Controller - signup / login / logout
// (handles both customer and admin login forms)
// JWT-based: login sets an httpOnly cookie containing a signed token
// instead of storing user data in a server-side session.
// ============================================
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { signToken } = require('../utils/jwt');

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days, matches JWT_EXPIRES_IN default

function setAuthCookie(res, user) {
    const token = signToken(user);
    res.cookie('token', token, {
        httpOnly: true,       // not accessible via client-side JS (XSS protection)
        maxAge: TOKEN_MAX_AGE,
        sameSite: 'lax'
        // secure: true,      // uncomment once served over HTTPS in production
    });
}

const authController = {
    // GET /signup
    showSignup(req, res) {
        res.render('signup', { title: 'Sign Up' });
    },

    // POST /signup
    async signup(req, res) {
        try {
            const { name, email, password, confirmPassword, phone, address } = req.body;

            if (!name || !email || !password) {
                req.flash('error', 'Name, email and password are required.');
                return res.redirect('/signup');
            }
            if (password !== confirmPassword) {
                req.flash('error', 'Passwords do not match.');
                return res.redirect('/signup');
            }
            if (password.length < 6) {
                req.flash('error', 'Password must be at least 6 characters.');
                return res.redirect('/signup');
            }

            const existing = await UserModel.findByEmail(email);
            if (existing) {
                req.flash('error', 'An account with this email already exists.');
                return res.redirect('/signup');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = await UserModel.create({
                name, email, password: hashedPassword, phone, address, role: 'customer'
            });

            // Auto-login after signup
            setAuthCookie(res, { id: userId, name, email, role: 'customer' });
            req.flash('success', `Welcome, ${name}! Your account has been created.`);
            return res.redirect('/');
        } catch (err) {
            console.error('Signup error:', err);
            req.flash('error', 'Something went wrong while creating your account.');
            return res.redirect('/signup');
        }
    },

    // GET /login
    showLogin(req, res) {
        res.render('login', { title: 'Login' });
    },

    // POST /login  (customer login; blocks admin accounts from this form)
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await UserModel.findByEmail(email);

            if (!user) {
                req.flash('error', 'Invalid email or password.');
                return res.redirect('/login');
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                req.flash('error', 'Invalid email or password.');
                return res.redirect('/login');
            }

            setAuthCookie(res, { id: user.id, name: user.name, email: user.email, role: user.role });

            if (user.role === 'admin') {
                return res.redirect('/admin/dashboard');
            }
            req.flash('success', `Welcome back, ${user.name}!`);
            return res.redirect('/');
        } catch (err) {
            console.error('Login error:', err);
            req.flash('error', 'Something went wrong while logging in.');
            return res.redirect('/login');
        }
    },

    // GET /admin/login
    showAdminLogin(req, res) {
        res.render('admin/login', { title: 'Admin Login', layout: false });
    },

    // POST /admin/login
    async adminLogin(req, res) {
        try {
            const { email, password } = req.body;
            const user = await UserModel.findByEmail(email);

            if (!user || user.role !== 'admin') {
                req.flash('error', 'Invalid admin credentials.');
                return res.redirect('/admin/login');
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                req.flash('error', 'Invalid admin credentials.');
                return res.redirect('/admin/login');
            }

            setAuthCookie(res, { id: user.id, name: user.name, email: user.email, role: user.role });
            return res.redirect('/admin/dashboard');
        } catch (err) {
            console.error('Admin login error:', err);
            req.flash('error', 'Something went wrong while logging in.');
            return res.redirect('/admin/login');
        }
    },

    // GET /logout (works for both customer & admin — just clears the JWT cookie)
    logout(req, res) {
        const wasAdmin = req.user && req.user.role === 'admin';
        res.clearCookie('token');
        res.redirect(wasAdmin ? '/admin/login' : '/login');
    }
};

module.exports = authController;
