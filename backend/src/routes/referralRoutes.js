const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', auth, upload.single('document'), referralController.uploadReferralResume);

router.post('/', auth, referralController.createReferral);
router.get('/my', auth, referralController.getMyReferrals);

// Admin/HR only (Controller handles role filtering if query param status is used)
router.get('/', auth, referralController.getAllReferrals);
router.get('/stats', auth, referralController.getReferralStats);
router.patch('/:id', auth, referralController.updateReferralStatus);

module.exports = router;
