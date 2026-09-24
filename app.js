// ============================================
// Foodie Delight - App Entry Point
// Node.js + Express + MySQL (MVC Architecture)
// Auth: JWT stored in an httpOnly cookie (no server-side session needed)
// ============================================
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const flashMiddleware = require('./middleware/flashMiddleware');
const { attachUserToLocals } = require('./middleware/authMiddleware');

const siteRoutes = require('./routes/siteRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ---------- View Engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout'); // default layout for the public site

// ---------- Middleware ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Flash messages (cookie-based, one-shot) — no session required
app.use(flashMiddleware);

// Decode JWT cookie (if present) -> req.user + res.locals.currentUser
// This is what keeps people logged in even after the server restarts,
// since the token lives in the browser's cookie, not server memory.
app.use(attachUserToLocals);

// ---------- Routes ----------
app.use('/', siteRoutes);
app.use('/', authRoutes);
app.use('/', orderRoutes);
app.use('/admin', adminRoutes);

// ---------- 404 Handler ----------
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found', layout: 'partials/layout' });
});

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).send('Something went wrong on our end. Please try again later.');
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🍔 Foodie Delight server running at http://localhost:${PORT}`);
});
