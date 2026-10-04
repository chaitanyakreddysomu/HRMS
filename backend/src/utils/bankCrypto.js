const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const BANK_FIELDS = ['holderName', 'accountNumber', 'ifsc', 'bankName', 'branch'];

// iv:tag:ciphertext, each base64 — distinguishes already-encrypted values
// from plaintext so re-saving an already-encrypted record is a no-op.
const CIPHERTEXT_FORMAT = /^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/;

function getKey() {
    const keyB64 = process.env.BANK_DETAILS_ENC_KEY;
    if (!keyB64) throw new Error('BANK_DETAILS_ENC_KEY is not set');
    const key = Buffer.from(keyB64, 'base64');
    if (key.length !== 32) throw new Error('BANK_DETAILS_ENC_KEY must decode to 32 bytes');
    return key;
}

function isEncrypted(value) {
    return typeof value === 'string' && CIPHERTEXT_FORMAT.test(value);
}

function encrypt(plaintext) {
    if (plaintext === undefined || plaintext === null || plaintext === '') return plaintext;
    if (isEncrypted(plaintext)) return plaintext;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

function decrypt(value) {
    if (!isEncrypted(value)) return value; // plaintext, legacy, or empty — pass through

    const [ivB64, tagB64, ciphertextB64] = value.split(':');
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
        decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
        const plaintext = Buffer.concat([
            decipher.update(Buffer.from(ciphertextB64, 'base64')),
            decipher.final()
        ]);
        return plaintext.toString('utf8');
    } catch (err) {
        console.error('Bank details decrypt failed:', err.message);
        return null;
    }
}

function encryptBankDetails(bankDetails) {
    if (!bankDetails) return bankDetails;
    const out = {};
    for (const key of Object.keys(bankDetails)) {
        out[key] = BANK_FIELDS.includes(key) ? encrypt(bankDetails[key]) : bankDetails[key];
    }
    return out;
}

function decryptBankDetails(bankDetails) {
    if (!bankDetails) return bankDetails;
    for (const field of BANK_FIELDS) {
        if (bankDetails[field] !== undefined) {
            bankDetails[field] = decrypt(bankDetails[field]);
        }
    }
    return bankDetails;
}

module.exports = { encrypt, decrypt, encryptBankDetails, decryptBankDetails, isEncrypted, BANK_FIELDS };
