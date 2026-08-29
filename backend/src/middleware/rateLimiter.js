const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Helper to extract user ID from JWT token or fallback to IP address
const getUserOrIPKey = (req) => {
    const authHeader = req.headers['authorization'] || req.header('Authorization');
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        if (token) {
            try {
                const verified = jwt.verify(token, process.env.JWT_SECRET);
                if (verified && (verified.id || verified._id)) {
                    return `user_${verified.id || verified._id}`;
                }
            } catch (err) {
                // Token verification failed or expired, fallback to IP
            }
        }
    }
    return req.ip;
};

// General rate limiter: 10 requests per minute per user/IP
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getUserOrIPKey,
    validate: { default: false }
});

// Login attempts rate limiter: 5 attempts per minute per IP (uses default IP generator)
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { message: "Too many login attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    apiLimiter,
    loginLimiter
};
