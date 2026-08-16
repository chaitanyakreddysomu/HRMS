const express = require('express');
const router = express.Router();
const birthdayController = require('../controllers/birthdayController');
const auth = require('../middleware/auth');

router.get('/', auth, birthdayController.getTodayBirthdays);

module.exports = router;
