// One-time migration: encrypts any bankDetails fields that are still
// stored as plaintext from before field-level encryption was added
// (see src/utils/bankCrypto.js and the hooks in src/models/User.js).
// Safe to re-run — already-encrypted values are left untouched.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { isEncrypted, BANK_FIELDS } = require('../src/utils/bankCrypto');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find({
        $or: BANK_FIELDS.map(f => ({ [`bankDetails.${f}`]: { $exists: true, $ne: '' } }))
    });

    let migrated = 0;
    for (const user of users) {
        const bd = user.bankDetails || {};
        const needsEncryption = BANK_FIELDS.some(f => bd[f] && !isEncrypted(bd[f]));
        if (!needsEncryption) continue;

        user.markModified('bankDetails');
        await user.save();
        migrated++;
        console.log(`Encrypted bankDetails for ${user.id}`);
    }

    console.log(`Done. Migrated ${migrated} of ${users.length} user(s) with bank details.`);
    await mongoose.disconnect();
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
