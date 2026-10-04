const router = require('express').Router();
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.post('/', auth, logController.createLog);
router.get('/', auth, requireRole('ADMIN', 'HR'), logController.getLogs);

module.exports = router;
