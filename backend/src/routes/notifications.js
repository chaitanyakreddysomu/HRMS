const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.post('/', auth, notificationController.createNotification);
router.get('/', auth, notificationController.getNotifications);

router.post('/subscribe', auth, notificationController.subscribe);
router.post('/register-fcm', auth, notificationController.registerFCM);

// Mobile app: Expo push, alongside the FCM path the browser uses
router.post('/register-expo', auth, notificationController.registerExpo);
router.post('/unregister-expo', auth, notificationController.unregisterExpo);
router.post('/unregister-fcm', auth, notificationController.unregisterFCM);

router.get('/unread-count', auth, notificationController.getUnreadCount);
router.patch('/read-all', auth, notificationController.markAllRead);

router.get('/check-fcm-status', auth, notificationController.checkFCMStatus);
router.post('/test-fcm', auth, notificationController.sendTestFCM);
router.post('/test-expo', auth, notificationController.sendTestExpo);

// Anything with an id goes last, so it cannot swallow the named routes
router.patch('/:id/read', auth, notificationController.markRead);
router.get('/:id', auth, notificationController.getNotificationById);

module.exports = router;
