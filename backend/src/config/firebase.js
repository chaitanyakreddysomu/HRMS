
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let _initialized = false;

try {
    let credentialConfig;

    // 1. Check for separate environment variables (Preferred for Render to handle newlines correctly)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        console.log("Attempting to initialize Firebase from Separate Environment Variables");
        credentialConfig = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Handle both already-newlined keys and double-escaped \\n sequences
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
    }
    // 2. Check for single JSON string environment variable (Legacy/Alternative)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            console.log("Attempting to initialize Firebase from FIREBASE_SERVICE_ACCOUNT JSON string");
            credentialConfig = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", e.message);
        }
    }
    // 3. Fallback to Local File (Development)
    else {
        try {
            console.log("Attempting to initialize Firebase from local file");
            credentialConfig = require('./service-account.json');
        } catch (e) {
            console.log("No local service-account.json found (Expected in production if using Env vars)");
        }
    }

    if (credentialConfig) {
        if (!getApps().length) {
            initializeApp({ credential: cert(credentialConfig) });
            console.log("Firebase Admin Initialized Successfully");
        }
        _initialized = true;
    } else {
        console.warn("WARNING: No valid Firebase credentials found (Env or File). Push notifications will fail.");
    }

} catch (error) {
    console.error("Firebase Admin Critical Init Error:", error.message);
}

// Compatibility shim — existing controllers call admin.messaging() unchanged
module.exports = {
    messaging: _initialized ? () => getMessaging() : null,
};
