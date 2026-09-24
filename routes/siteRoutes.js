const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const contactController = require('../controllers/contactController');

router.get('/', siteController.home);
router.get('/menu', siteController.menu);
router.get('/about', siteController.about);
router.get('/contact', contactController.showContact);
router.post('/contact', contactController.submitContact);

module.exports = router;
