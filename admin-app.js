// ============================================
// Foodie Delight - ADMIN PANEL (separate app)
// Runs on its own port / own domain, separate from the public user site.
// Uses the same database, but a different login cookie (admin_token).
// Start: npm run dev:admin   (local)   |   npm run start:admin  (production)
// ============================================
process.env.APP_MODE = 'admin';   // must be set BEFORE loading anything else
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

const flashMiddleware = require('./middleware/flashMiddleware');
const { attachUserToLocals } = require('./middleware/authMiddleware');
const authController = require('./controllers/authController');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(flashMiddleware);
app.use(attachUserToLocals);

// Keep this panel out of search engines
app.use((req, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
});

app.get('/health', (req, res) => res.send('ok'));
app.get('/', (req, res) => res.redirect('/admin/login'));
app.get('/logout', authController.logout);
app.use('/admin', adminRoutes);

app.use((req, res) => res.status(404).send('Not found'));
app.use((err, req, res, next) => {
    console.error('Admin app error:', err);
    res.status(500).send('Something went wrong.');
});

const PORT = process.env.ADMIN_PORT || process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🛠️  Foodie Delight ADMIN running at http://localhost:${PORT}/admin/login`);
});