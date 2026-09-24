// ============================================
// Admin Menu Controller - CRUD for menu_items
// ============================================
const MenuModel = require('../../models/menuModel');

const adminMenuController = {
    // GET /admin/menu
    async list(req, res) {
        try {
            const items = await MenuModel.getAllForAdmin();
            res.render('admin/menu-list', { title: 'Manage Menu', layout: false, items });
        } catch (err) {
            console.error('Admin menu list error:', err);
            res.render('admin/menu-list', { title: 'Manage Menu', layout: false, items: [] });
        }
    },

    // GET /admin/menu/add
    showAddForm(req, res) {
        res.render('admin/menu-form', { title: 'Add Menu Item', layout: false, item: null, formAction: '/admin/menu/add' });
    },

    // POST /admin/menu/add
    async add(req, res) {
        try {
            const { name, description, price, category, image, is_featured } = req.body;
            if (!name || !price || !category) {
                req.flash('error', 'Name, price and category are required.');
                return res.redirect('/admin/menu/add');
            }
            await MenuModel.create({
                name, description, price, category,
                image: image || 'img/food/default.jpg',
                is_featured: is_featured === 'on'
            });
            req.flash('success', 'Menu item added successfully.');
            res.redirect('/admin/menu');
        } catch (err) {
            console.error('Admin menu add error:', err);
            req.flash('error', 'Failed to add menu item.');
            res.redirect('/admin/menu/add');
        }
    },

    // GET /admin/menu/edit/:id
    async showEditForm(req, res) {
        try {
            const item = await MenuModel.findById(req.params.id);
            if (!item) {
                req.flash('error', 'Menu item not found.');
                return res.redirect('/admin/menu');
            }
            res.render('admin/menu-form', {
                title: 'Edit Menu Item', layout: false, item, formAction: `/admin/menu/edit/${item.id}`
            });
        } catch (err) {
            console.error('Admin menu edit form error:', err);
            res.redirect('/admin/menu');
        }
    },

    // POST /admin/menu/edit/:id
    async edit(req, res) {
        try {
            const { name, description, price, category, image, is_featured, is_available } = req.body;
            await MenuModel.update(req.params.id, {
                name, description, price, category,
                image: image || 'img/food/default.jpg',
                is_featured: is_featured === 'on',
                is_available: is_available === 'on'
            });
            req.flash('success', 'Menu item updated successfully.');
            res.redirect('/admin/menu');
        } catch (err) {
            console.error('Admin menu edit error:', err);
            req.flash('error', 'Failed to update menu item.');
            res.redirect('/admin/menu');
        }
    },

    // POST /admin/menu/delete/:id
    async delete(req, res) {
        try {
            await MenuModel.delete(req.params.id);
            req.flash('success', 'Menu item deleted.');
            res.redirect('/admin/menu');
        } catch (err) {
            console.error('Admin menu delete error:', err);
            req.flash('error', 'Failed to delete menu item.');
            res.redirect('/admin/menu');
        }
    }
};

module.exports = adminMenuController;
