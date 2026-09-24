// ============================================
// Site Controller - public pages (home, menu, about)
// ============================================
const MenuModel = require('../models/menuModel');

const siteController = {
    // GET /
    async home(req, res) {
        try {
            const featuredFoods = await MenuModel.getFeatured(3);
            res.render('index', { title: 'Home', featuredFoods });
        } catch (err) {
            console.error('Home page error:', err);
            res.render('index', { title: 'Home', featuredFoods: [] });
        }
    },

    // GET /menu?category=pizza
    async menu(req, res) {
        try {
            const category = req.query.category || 'all';
            const foods = await MenuModel.getAll(category);
            const categories = await MenuModel.getCategories();
            res.render('menu', { title: 'Our Menu', foods, categories, activeCategory: category });
        } catch (err) {
            console.error('Menu page error:', err);
            res.render('menu', { title: 'Our Menu', foods: [], categories: [], activeCategory: 'all' });
        }
    },

    // GET /about
    about(req, res) {
        res.render('about', { title: 'About Us' });
    }
};

module.exports = siteController;
