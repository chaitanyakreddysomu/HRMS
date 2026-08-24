const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const auth = require('../middleware/auth');

router.route('/')
  .get(themeController.getThemeSettings) // Public or private? Let's make it public for login screen or keep private, but we need it when rendering. We can make it public so the app can fetch theme before login.
  .put(auth, themeController.updateThemeSettings); // Update requires admin/auth

module.exports = router;
