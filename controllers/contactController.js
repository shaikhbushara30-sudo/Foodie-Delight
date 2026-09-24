// ============================================
// Contact Controller
// ============================================
const ContactModel = require('../models/contactModel');

const contactController = {
    // GET /contact
    showContact(req, res) {
        res.render('contact', { title: 'Contact Us' });
    },

    // POST /contact
    async submitContact(req, res) {
        try {
            const { name, email, message } = req.body;
            if (!name || !email || !message) {
                req.flash('error', 'Please fill in all fields.');
                return res.redirect('/contact');
            }
            await ContactModel.create({ name, email, message });
            req.flash('success', 'Thank you for your message! We will get back to you soon.');
            return res.redirect('/contact');
        } catch (err) {
            console.error('Contact submit error:', err);
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect('/contact');
        }
    }
};

module.exports = contactController;
