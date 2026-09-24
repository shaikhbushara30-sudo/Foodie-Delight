// ============================================
// Admin Message Controller - view contact messages
// ============================================
const ContactModel = require('../../models/contactModel');

const adminMessageController = {
    // GET /admin/messages
    async list(req, res) {
        try {
            const messages = await ContactModel.getAll();
            res.render('admin/messages', { title: 'Contact Messages', layout: false, messages });
        } catch (err) {
            console.error('Admin messages list error:', err);
            res.render('admin/messages', { title: 'Contact Messages', layout: false, messages: [] });
        }
    },

    // POST /admin/messages/:id/read
    async markRead(req, res) {
        try {
            await ContactModel.markAsRead(req.params.id);
            res.redirect('/admin/messages');
        } catch (err) {
            console.error('Admin mark read error:', err);
            res.redirect('/admin/messages');
        }
    },

    // POST /admin/messages/:id/delete
    async delete(req, res) {
        try {
            await ContactModel.delete(req.params.id);
            req.flash('success', 'Message deleted.');
            res.redirect('/admin/messages');
        } catch (err) {
            console.error('Admin message delete error:', err);
            res.redirect('/admin/messages');
        }
    }
};

module.exports = adminMessageController;
