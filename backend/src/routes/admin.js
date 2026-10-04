const router = require('express').Router();
const adminController = require('../controllers/adminController');
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const multer = require('multer');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');

const upload = multer({ storage: multer.memoryStorage() });

// Every route under /api/admin is Admin-only.
router.use(auth, requireRole('ADMIN'));

// Dashboard Routes
router.get('/dashboard', adminController.getAdminDashboardStats);

// Profile Routes
router.get('/profile', adminController.getAdminProfile);
router.patch('/profile/edit', adminController.updateAdminProfile);
router.post('/profile-image', upload.single('image'), adminController.uploadProfileImage);
router.get('/bank-details', adminController.getAdminBankDetails);

// Pending Requests Routes
router.get('/pending-requests', adminController.getPendingRequests);
router.get('/pending-requests/:id', adminController.getRequestById);
router.patch('/pending-requests/:id', adminController.updateRequestStatus);

// Employee Management Routes
router.get('/employees', adminController.getAllEmployees);
router.post('/employees', adminController.createEmployee);
router.get('/employees/:id', adminController.getEmployeeById);
router.put('/employees/:id', adminController.updateEmployee);
router.get('/employee-bank-details', adminController.getEmployeeBankDetails);

// Document Management Routes
router.get('/documents', adminController.getAllEmployeeDocuments);
router.get('/document-preview', adminController.getAdminDocumentPreview);
router.get('/documents/:id', adminController.getEmployeeDocuments); // :id can be empId
router.put('/documents/:empId/:docId', adminController.updateDocumentStatus);

// Attendance Routes
router.get('/attendance', adminController.getAttendanceRecords);

// Leave Management Routes
router.get('/leaves', adminController.getLeaveRequests);
router.get('/leaves/:id', adminController.getLeaveRequestById);
router.put('/leaves/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        const leave = await Leave.findByIdAndUpdate(
            id,
            { status, rejectionReason },
            { returnDocument: 'after' }
        );

        if (!leave) return res.status(404).json({ message: "Leave not found" });

        // --- NOTIFICATION LOGIC (ADMIN SOURCE) ---
        try {
            const user = await User.findOne({ id: leave.userId });
            if (user) {
                let notifTitle = "";
                let notifMessage = "";
                let notifType = "info";

                const sDate = new Date(leave.startDate).toLocaleDateString();
                const eDate = new Date(leave.endDate).toLocaleDateString();
                const dateRange = sDate === eDate ? `on ${sDate}` : `from ${sDate} to ${eDate}`;

                if (status === 'Approved') {
                    notifTitle = "Leave Approved";
                    notifMessage = `Your leave request for ${leave.type} ${dateRange} has been approved by Admin.`;
                    notifType = 'success';
                } else if (status === 'Rejected') {
                    notifTitle = "Leave Rejected";
                    notifMessage = `Your leave request ${dateRange} was rejected by Admin. Reason: ${rejectionReason || "Admin decision"}`;
                    notifType = 'alert';
                }

                if (notifTitle) {
                    // Log intention
                    console.log(`[AdminLeaveNotification] Status Update: ${status} for User: ${user.id}`);

                    // Create Notification
                    await Notification.create({
                        title: notifTitle,
                        message: notifMessage,
                        to: user.id,
                        source: 'ADMIN',
                        type: notifType,
                        date: new Date()
                    });

                    // Send FCM
                    const tokens = [];
                    if (user.fcmTokens && user.fcmTokens.length > 0) {
                        user.fcmTokens.forEach(t => {
                            if (t.token) tokens.push(t.token);
                        });
                    }
                    // REMOVED LEGACY fcmToken fallback

                    const uniqueTokens = [...new Set(tokens.filter(t => t))];

                    if (uniqueTokens.length > 0) {
                        const adminInfo = require('../config/firebase'); // Avoid name clash
                        if (adminInfo.messaging) {
                            const response = await adminInfo.messaging().sendEachForMulticast({
                                notification: { title: notifTitle, body: notifMessage },
                                tokens: uniqueTokens
                            });
                            console.log(`[AdminLeaveNotification] Sent to ${user.id}: ${response.successCount} success, ${response.failureCount} failure`);

                            if (response.failureCount > 0) {
                                response.responses.forEach(async (resp, idx) => {
                                    if (!resp.success) {
                                        const error = resp.error;
                                        const badToken = uniqueTokens[idx];
                                        console.error(`[AdminLeaveNotification] Failure for token index ${idx} (${badToken ? badToken.substring(0, 10) + '...' : 'unknown'}):`, error);

                                        if (
                                            error.code === 'messaging/registration-token-not-registered' ||
                                            error.code === 'messaging/invalid-registration-token' ||
                                            error.code === 'messaging/third-party-auth-error'
                                        ) {
                                            await User.updateOne(
                                                { id: leave.userId },
                                                { $pull: { fcmTokens: { token: badToken } } }
                                            );
                                        }
                                    }
                                });
                            }
                        }
                    } else {
                        console.log(`[AdminLeaveNotification] No FCM tokens found for user ${user.id}. Skipping push.`);
                    }
                }
            }
        } catch (nErr) {
            console.error("Admin Leave Notif Error:", nErr);
        }

        res.json({ message: "Leave updated", leave });
    } catch (error) {
        console.error("Update Leave Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Holiday Management Routes
router.get('/holidays', adminController.getHolidays);
router.post('/holidays', adminController.createHoliday);
router.patch('/holidays/:id', adminController.updateHoliday);
router.delete('/holidays/:id', adminController.deleteHoliday);

// Policy Management Routes
router.get('/policies', adminController.getPolicies);
router.post('/policies', adminController.createPolicy);
router.put('/policies/:id', adminController.updatePolicy);
router.delete('/policies/:id', adminController.deletePolicy);

// Notification Management Routes
router.get('/notifications/sent', adminController.getSentNotifications);
router.get('/notifications', adminController.getAdminNotifications);
router.post('/notifications', adminController.createAdminNotification);
router.post('/notifications/fcm-token', adminController.saveFCMToken); // NEW
router.get('/notifications/:id', adminController.getNotificationById);
router.patch('/notifications/:id', adminController.updateNotificationStatus);

// Complaint Management Routes
router.get('/complaints', adminController.getAdminComplaints);
router.get('/complaints/:id', adminController.getComplaintById);
router.patch('/complaints/:id', adminController.updateComplaintStatus);

// Payslip Management Routes
router.post('/payslips', adminController.createPayslip); // Create and Auto-Calculate
router.get('/payslips', adminController.getAdminPayslips);
router.get('/payslips/:id', adminController.getPayslipById);
router.patch('/payslips/:id', adminController.updatePayslip);
router.delete('/payslips/:id', adminController.deletePayslip);
router.get('/payslips/calculate/stats', adminController.calculatePayslipStats); // Helper for frontend

// Salary Structure Routes
router.get('/salary-structures', adminController.getSalaryStructures);
router.post('/salary-structures', adminController.createSalaryStructure);
router.patch('/salary-structures/:id', adminController.updateSalaryStructure);
router.delete('/salary-structures/:id', adminController.deleteSalaryStructure);
router.get('/salary-structures/calculate/:empId', adminController.getEmployeeSalaryDetails); // Helper

// System Logs
router.get('/logs', logController.getLogs);

// 2FA Management
router.get('/users-2fa', adminController.getUsers2FAStatus);

module.exports = router;
