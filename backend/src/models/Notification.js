const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    to: { type: String, required: true }, // Changed to String ID for 1-to-1 copies
    source: { type: String },
    type: { type: String, default: 'info' }, // alert, success, info
    // Where tapping this notification should take the reader.
    // `category` names the subject, `entityId` the record it is about.
    category: { type: String }, // leave, complaint, referral, request, payslip
    entityId: { type: String }
});

// Performance Indexes
notificationSchema.index({ to: 1, read: 1, date: -1 }); // Get my unread
notificationSchema.index({ to: 1, date: -1 }); // Get all my notifications

module.exports = mongoose.model('Notification', notificationSchema);
