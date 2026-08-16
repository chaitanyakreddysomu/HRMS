const Referral = require('../models/Referral');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const { sendPushToUser } = require('./notificationController');
const supabase = require('../config/supabase');

// @desc Upload resume for referral
// @route POST /api/referrals/upload
exports.uploadReferralResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileName = `${Date.now()}-${req.file.originalname}`;
        const filePath = fileName; // No need for subfolder if using dedicated bucket

        // Check/Create bucket 'referral-resumes' if it doesn't exist
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets || !buckets.find(b => b.name === 'referral-resumes')) {
            await supabase.storage.createBucket('referral-resumes', { public: true });
        }

        const { error } = await supabase.storage
            .from('referral-resumes')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) throw error;

        const publicUrl = supabase.storage.from('referral-resumes').getPublicUrl(filePath).data.publicUrl;

        res.json({
            message: "Resume uploaded successfully",
            resumeUrl: publicUrl,
            fileName: req.file.originalname
        });

    } catch (error) {
        console.error("Referral Resume Upload Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Helper to push notification to employee
const notifyEmployee = async (userId, title, message) => {
    try {
        const notification = new Notification({
            to: userId,
            title,
            message,
            date: new Date(),
            read: false,
            type: 'info'
        });
        await notification.save();
        await sendPushToUser(userId, title, message);
    } catch (error) {
        console.error("Error notifying employee:", error);
    }
};

// @desc Save new referral
// @route POST /api/referrals
exports.createReferral = async (req, res) => {
    try {
        const {
            candidateName, email, phone, location, role, expectedSalary,
            noticePeriod, experienceType, qualification, college, passoutYear,
            totalExperience, currentCompany, currentCTC, companyHistory,
            skills, resumeUrl, relationship, whyReferring
        } = req.body;

        const newReferral = new Referral({
            referredBy: req.user.mongoId,
            referredByEmpId: req.user.id,
            referredByName: req.user.name,
            candidateName, email, phone, location, role, expectedSalary,
            noticePeriod, experienceType, qualification, college, passoutYear,
            totalExperience, currentCompany, currentCTC, companyHistory,
            skills, resumeUrl, relationship, whyReferring
        });

        await newReferral.save();

        await logger.logAction(req, req.user, 'Referral', 'Create', `Referred candidate: ${candidateName}`, 'Success');

        res.status(201).json({ message: "Referral submitted successfully", referral: newReferral });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc Get referrals made by logged in employee
// @route GET /api/referrals/my
exports.getMyReferrals = async (req, res) => {
    try {
        const referrals = await Referral.find({ referredBy: req.user.mongoId }).sort({ createdAt: -1 });
        res.json(referrals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc Get all referrals (Admin/HR)
// @route GET /api/referrals
exports.getAllReferrals = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status && status !== 'All') query.status = status;
        if (search) {
            query.$or = [
                { candidateName: { $regex: search, $options: 'i' } },
                { referredByName: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } }
            ];
        }

        const referrals = await Referral.find(query).sort({ createdAt: -1 });
        res.json(referrals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc Update referral status
// @route PATCH /api/referrals/:id
exports.updateReferralStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const referral = await Referral.findById(req.params.id);

        if (!referral) return res.status(404).json({ message: "Referral not found" });

        const oldStatus = referral.status;
        referral.status = status;
        if (remarks) referral.remarks = remarks;

        await referral.save();

        // Notify Employee if status changed
        if (oldStatus !== status) {
            await notifyEmployee(
                referral.referredBy,
                "Referral Status Update",
                `Your referral ${referral.candidateName}'s status has been changed to ${status}.`
            );
        }

        await logger.logAction(req, req.user, 'Referral', 'Update Status', `Updated status for ${referral.candidateName} to ${status}`, 'Success');

        res.json({ message: "Status updated successfully", referral });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc Get referral stats
// @route GET /api/referrals/stats
exports.getReferralStats = async (req, res) => {
    try {
        const total = await Referral.countDocuments();
        const underReview = await Referral.countDocuments({ status: 'Under Review' });
        const interview = await Referral.countDocuments({ status: 'Interview Scheduled' });
        const selected = await Referral.countDocuments({ status: 'Selected' });
        const joined = await Referral.countDocuments({ status: 'Joined' });
        const rejected = await Referral.countDocuments({ status: 'Rejected' });

        res.json({
            total,
            underReview,
            interview,
            selected,
            joined,
            rejected
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
