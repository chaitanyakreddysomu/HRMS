const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.post('/', auth, notificationController.createNotification);
router.get('/', auth, notificationController.getNotifications);

// Mobile app: push is Expo-only now, browser push (Firebase/FCM) removed
router.post('/register-expo', auth, notificationController.registerExpo);
router.post('/unregister-expo', auth, notificationController.unregisterExpo);

router.get('/unread-count', auth, notificationController.getUnreadCount);
router.patch('/read-all', auth, notificationController.markAllRead);

router.post('/test-expo', auth, notificationController.sendTestExpo);

// Anything with an id goes last, so it cannot swallow the named routes
router.patch('/:id/read', auth, notificationController.markRead);
router.get('/:id', auth, notificationController.getNotificationById);

module.exports = router;
