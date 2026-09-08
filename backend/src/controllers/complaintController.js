const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { notifyRoles } = require('../utils/push');

exports.createComplaint = async (req, res) => {
    try {
        // Fetch full user details to get department
        const user = await User.findOne({ id: req.user.id });

        const newComplaint = new Complaint({
            ...req.body,
            userId: req.user.id,
            userName: req.user.name,
            department: user ? user.department : 'General'
        });
        await newComplaint.save();

        // HR should see a complaint the moment it is raised
        notifyRoles(['HR', 'ADMIN'], {
            title: 'New Complaint',
            body: `${newComplaint.userName || 'An employee'} raised: ${newComplaint.subject}`,
            type: 'alert',
            source: 'SYSTEM',
            category: 'complaint',
            entityId: newComplaint._id
        });

        res.status(201).json(newComplaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getComplaints = async (req, res) => {
    try {
        const query = req.user.role === 'EMPLOYEE' ? { userId: req.user.id } : {};
        const complaints = await Complaint.find(query).sort({ date: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateComplaint = async (req, res) => {
    try {
        const updated = await Complaint.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
