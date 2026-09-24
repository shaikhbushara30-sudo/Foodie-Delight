const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/authMiddleware');

router.get('/signup', redirectIfAuthenticated, authController.showSignup);
router.post('/signup', redirectIfAuthenticated, authController.signup);

router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', redirectIfAuthenticated, authController.login);

router.get('/logout', authController.logout);

module.exports = router;
