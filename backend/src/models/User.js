const mongoose = require('mongoose');
const { encrypt, encryptBankDetails, decryptBankDetails, BANK_FIELDS } = require('../utils/bankCrypto');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // e.g. EMP001
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'HR', 'EMPLOYEE'], default: 'EMPLOYEE' },
    designation: { type: String },
    department: { type: String },
    package: { type: Number, default: 0 }, // Annual Package
    status: { type: String, enum: ['Active', 'Inactive', 'Pending', 'Rejected'], default: 'Pending' },
    /** true for an account still on its default password, e.g. one an admin just created */
    mustChangePassword: { type: Boolean, default: false },
    joiningDate: { type: Date },
    phone: { type: String },
    address: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { type: String },
    emergencyContact: {
        name: String,
        phone: String
    },
    uan: { type: String },
    bankDetails: {
        holderName: String,
        accountNumber: String,
        ifsc: String,
        bankName: String,
        branch: String
    },
    projectStatus: { type: String, enum: ['In Project', 'Bench', 'Training'], default: 'Bench' },
    documents: [{
        category: String,
        name: String,
        docId: String,
        path: String,
        status: { type: String, enum: ['Verified', 'Rejected', 'Review'], default: 'Review' },
        rejectionReason: String,
        uploadedAt: Date
    }],
    pushSubscriptions: [{ type: Object }], // Legacy Web Push
    fcmTokens: [{
        token: { type: String },
        device: { type: String },
        deviceId: { type: String }, // Unique ID for browser/device instance
        lastActive: { type: Date, default: Date.now }
    }],
    // Expo push tokens for the mobile app. Kept apart from fcmTokens
    // because they go to Expo's service, not to Firebase.
    expoPushTokens: [{
        token: { type: String },
        device: { type: String },
        deviceId: { type: String },
        lastActive: { type: Date, default: Date.now }
    }],
    profileImage: { type: String }, // URL from Supabase
    fcmToken: { type: String, default: null }, // Legacy/Single device fallback
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false }
}, { timestamps: true });

// Performance Indexes
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ department: 1 });
userSchema.index({ projectStatus: 1 });

// bankDetails is encrypted at rest (AES-256-GCM, see utils/bankCrypto.js).
// These hooks encrypt on every write path and decrypt on every read path
// so no controller needs to know the fields are encrypted in the DB.

function decryptDoc(doc) {
    if (doc && doc.bankDetails) decryptBankDetails(doc.bankDetails);
}

userSchema.pre('save', function () {
    if (this.isModified('bankDetails') && this.bankDetails) {
        const plain = typeof this.bankDetails.toObject === 'function'
            ? this.bankDetails.toObject()
            : this.bankDetails;
        this.bankDetails = encryptBankDetails(plain);
    }
});

userSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function () {
    const update = this.getUpdate();
    if (!update) return;

    if (update.bankDetails) {
        update.bankDetails = encryptBankDetails(update.bankDetails);
    }
    if (update.$set) {
        if (update.$set.bankDetails) {
            update.$set.bankDetails = encryptBankDetails(update.$set.bankDetails);
        }
        // Dot-notation partial updates, e.g. { $set: { 'bankDetails.accountNumber': '...' } }
        for (const field of BANK_FIELDS) {
            const dotKey = `bankDetails.${field}`;
            if (update.$set[dotKey] !== undefined) {
                update.$set[dotKey] = encrypt(update.$set[dotKey]);
            }
        }
    }
});

userSchema.post('find', function (docs) {
    if (Array.isArray(docs)) docs.forEach(decryptDoc);
});

userSchema.post(['findOne', 'findOneAndUpdate'], function (doc) {
    decryptDoc(doc);
});

module.exports = mongoose.model('User', userSchema);
