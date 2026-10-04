// One-time migration: encrypts any phone / emergencyContact.phone fields
// still stored as plaintext from before field-level encryption was added
// (see src/utils/bankCrypto.js and the hooks in src/models/User.js).
//
// Note: User.find() decrypts on read, so by the time a document reaches
// this script its phone fields are already plaintext in memory regardless
// of whether they were encrypted or plaintext in the DB - there is no way
// to tell the difference here. Re-saving is a safe no-op either way (an
// already-encrypted value is decrypted then re-encrypted with a fresh
// IV; a still-plaintext value is encrypted for the first time), so this
// script just unconditionally re-saves every matched user. Safe to re-run.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find({
        $or: [
            { phone: { $exists: true, $ne: '' } },
            { 'emergencyContact.phone': { $exists: true, $ne: '' } }
        ]
    });

    for (const user of users) {
        user.markModified('phone');
        user.markModified('emergencyContact');
        await user.save();
        console.log(`Encrypted phone fields for ${user.id}`);
    }

    console.log(`Done. Migrated ${users.length} user(s).`);
    await mongoose.disconnect();
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
