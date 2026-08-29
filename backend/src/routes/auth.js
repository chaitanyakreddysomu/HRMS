const router = require('express').Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

router.post('/login', loginLimiter, authController.login);
router.post('/login/2fa', authController.verify2FALogin);
router.post('/refresh', authController.refresh);
router.post('/register', authController.register);

// 2FA Management (Requires authentication)
router.get('/2fa/status', auth, authController.get2FAStatus);
router.post('/2fa/setup', auth, authController.setup2FA);
router.post('/2fa/verify', auth, authController.verify2FA);
router.post('/2fa/disable', auth, authController.disable2FA);

module.exports = router;
