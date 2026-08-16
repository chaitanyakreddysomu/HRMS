const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referredByEmpId: { type: String, required: true }, // For quick display
    referredByName: { type: String, required: true },

    // Candidate Details
    candidateName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String },
    role: { type: String, required: true },
    expectedSalary: { type: String },
    noticePeriod: { type: String },

    experienceType: {
        type: String,
        enum: ['Fresher', 'Experienced'],
        required: true
    },

    // Fresher specific
    qualification: { type: String },
    college: { type: String },
    passoutYear: { type: String },

    // Experienced specific
    totalExperience: { type: String }, // e.g. "3 Years 9 Months"
    currentCompany: { type: String },
    currentCTC: { type: String },
    companyHistory: [{
        companyName: String,
        role: String,
        from: String, // Month + Year
        to: String,   // Month + Year / Present
        duration: String
    }],

    skills: [String],
    resumeUrl: { type: String },
    relationship: { type: String },
    whyReferring: { type: String },

    status: {
        type: String,
        enum: ['Under Review', 'Interview Scheduled', 'Shortlisted', 'Selected', 'Joined', 'Rejected'],
        default: 'Under Review'
    },
    remarks: { type: String },
    appliedOn: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Referral', referralSchema);
