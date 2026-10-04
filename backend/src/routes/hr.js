const router = require('express').Router();
const hrController = require('../controllers/hrController');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Everything under /api/hr requires at least HR or Admin.
router.use(auth, requireRole('ADMIN', 'HR'));

router.get('/dashboard', hrController.getHRDashboardStats);
router.get('/profile', hrController.getHRProfile);
router.put('/profile', hrController.updateHRProfile);
router.patch('/profile', hrController.updateHRProfile);
router.post('/profile-image', upload.single('image'), hrController.uploadProfileImage);

// Documents
router.post('/documents/upload', upload.single('document'), hrController.uploadDocument);
router.get('/documents/preview', hrController.getDocumentPreview);

router.get('/employee-complaints', hrController.getAllEmployeeComplaints);
router.patch('/employee-complaints/:id', hrController.updateComplaintStatus);
router.get('/my-complaints', hrController.getMyComplaints);
router.post('/my-complaints', hrController.createMyComplaint);
router.get('/notifications/sent', hrController.getSentNotifications);
router.get('/notifications/my', hrController.getReceivedNotifications);
router.post('/notifications', hrController.createHRNotification);
router.patch('/notifications/:id/read', hrController.markNotificationAsRead);
router.get('/employees/select', hrController.getAllEmployeesForSelect);
router.get('/employees', hrController.getEmployees);
router.get('/employees/:id', hrController.getEmployeeById);

// Registration Requests
router.get('/pending-requests', hrController.getPendingRequests);
router.get('/pending-requests/:id', hrController.getPendingRequestById);
router.patch('/pending-requests/:id', hrController.updateRequestStatus);

// Policy Management (HR can also manage policies)
router.get('/policies', adminController.getPolicies);
router.post('/policies', adminController.createPolicy);
router.put('/policies/:id', adminController.updatePolicy);
router.delete('/policies/:id', adminController.deletePolicy);

// Holiday Management (HR can also manage holidays)
router.get('/holidays', adminController.getHolidays);
router.post('/holidays', adminController.createHoliday);
router.patch('/holidays/:id', adminController.updateHoliday);
router.delete('/holidays/:id', adminController.deleteHoliday);

// Leave Management
router.get('/leaves', hrController.getLeaveRequests);
router.get('/leaves/:id', hrController.getLeaveRequestById);
router.put('/leaves/:id', hrController.updateLeaveStatus);

const attendanceController = require('../controllers/attendanceController');

// Attendance (Personal Punch In/Out)
router.post('/punch-in', attendanceController.punchIn);
router.patch('/punch-out', attendanceController.punchOut);
router.get('/attendance/status', attendanceController.getTodayStatus);

// Attendance (View All)
router.get('/attendance', adminController.getAttendanceRecords);

// Payslips (Personal)
router.get('/payslips', hrController.getHRPayslips);

module.exports = router;
