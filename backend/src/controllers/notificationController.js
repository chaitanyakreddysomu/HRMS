const Notification = require('../models/Notification');
const User = require('../models/User');

// Browser push (Firebase/FCM) has been removed - push notifications are
// mobile-only now, delivered over Expo. See utils/push.js.

// Helper to send push - push only, callers write their own Notification
// record. Sends to every device the user has registered via Expo
// (mobile); userId 'ALL' broadcasts to every active user.
exports.sendPushToUser = async (userId, payload) => {
    try {
        const { sendExpoPush, expoTokensFor } = require('../utils/push');

        const tokens = await expoTokensFor(userId);
        await sendExpoPush(tokens, payload);
    } catch (e) {
        console.error("Send Push Logic Error:", e);
    }
};

exports.createNotification = async (req, res) => {
    try {
        const notification = new Notification(req.body);
        await notification.save();

        // Trigger Push
        const payload = {
            title: notification.title,
            body: notification.message,
            url: '/notifications', // Default URL
            icon: '/logo.png' // Optional
        };

        // Async send (don't block response)
        sendPushToUser(notification.to, payload);

        res.status(201).json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        // Simple logic: Fetch 'ALL' or specific to User ID
        const userId = req.user.id;
        const notifications = await Notification.find({
            $or: [
                { to: 'ALL' },
                { to: userId },
                { to: { $in: [userId] } }
            ]
        }).sort({ date: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });

        // Same ownership rule getNotificationById applies: without it
        // anyone signed in can clear somebody else's unread badge.
        const userId = req.user.id;
        if (notification.to !== 'ALL' && notification.to !== userId) {
            return res.status(403).json({ message: "Access Denied" });
        }

        notification.read = true;
        await notification.save();

        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });

        // Security check: ensure user is allowed to see this
        const userId = req.user.id;
        if (notification.to !== 'ALL' && notification.to !== userId && !notification.to.includes(userId)) {
            return res.status(403).json({ message: "Access Denied" });
        }

        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * ============================================================
 * EXPO PUSH REGISTRATION
 * ============================================================
 *
 * The mobile app hands over an Expo push token on every launch.
 * The same device isolation rules as FCM apply: one device only
 * ever belongs to the person currently signed in on it.
 */
exports.registerExpo = async (req, res) => {
    try {
        const { token, device, deviceId } = req.body;
        const userId = req.user.id;

        if (!token) return res.status(400).json({ message: "Token is required" });

        const targetDeviceId = deviceId || 'expo-' + token.slice(-12);

        // This device now belongs to this user, and nobody else
        await User.updateMany(
            {
                id: { $ne: userId },
                $or: [
                    { "expoPushTokens.deviceId": targetDeviceId },
                    { "expoPushTokens.token": token }
                ]
            },
            {
                $pull: {
                    expoPushTokens: {
                        $or: [{ deviceId: targetDeviceId }, { token }]
                    }
                }
            }
        );

        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.expoPushTokens) user.expoPushTokens = [];

        const existing = user.expoPushTokens.find(
            (t) => t.deviceId === targetDeviceId || t.token === token
        );

        if (existing) {
            existing.token = token;
            existing.device = device || existing.device;
            existing.deviceId = targetDeviceId;
            existing.lastActive = new Date();
        } else {
            user.expoPushTokens.push({
                token,
                device: device || 'mobile',
                deviceId: targetDeviceId,
                lastActive: new Date()
            });
        }

        await user.save();

        res.json({ message: "Expo push token registered" });
    } catch (err) {
        console.error("Register Expo Token Error:", err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * Sends a push to the caller's own devices and reports what happened.
 * A test that says "0 tokens" tells you the phone never registered,
 * which is a different problem from one that never arrives.
 */
exports.sendTestExpo = async (req, res) => {
    try {
        const { notifyUser, expoTokensFor } = require('../utils/push');

        const title = req.body?.title || "This is test heading";
        const body = req.body?.body || req.body?.message || "This is test description";

        const tokens = await expoTokensFor(req.user.id);

        // Goes through notifyUser so the test lands in the list as well
        // as on the lock screen: a test that only pushes cannot show
        // whether the stored half of the pipeline works.
        const record = await notifyUser(req.user.id, {
            title,
            body,
            source: 'SYSTEM',
            type: 'info',
            category: 'general',
            // Set by the "system tray" test, which wants the OS banner
            // even with the app open.
            forceSystem: !!req.body?.force
        });

        res.json({
            message: tokens.length
                ? `Sent to ${tokens.length} device(s)`
                : "Saved, but no phone is registered for push on this account",
            tokens: tokens.length,
            notificationId: record ? String(record._id) : null
        });
    } catch (err) {
        console.error("Test Expo Push Error:", err);
        res.status(500).json({ message: err.message });
    }
};

/** Drops this device, so a logged out phone stops being pushed to. */
exports.unregisterExpo = async (req, res) => {
    try {
        const { token, deviceId } = req.body;

        await User.updateMany(
            { id: req.user.id },
            {
                $pull: {
                    expoPushTokens: {
                        $or: [
                            { token: token || '__none__' },
                            { deviceId: deviceId || '__none__' }
                        ]
                    }
                }
            }
        );

        res.json({ message: "Expo push token removed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/** The badge on the bell, without pulling the whole list down. */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Notification.countDocuments({
            read: false,
            $or: [{ to: 'ALL' }, { to: userId }, { to: { $in: [userId] } }]
        });

        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/** Clears the badge in one go. */
exports.markAllRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            {
                read: false,
                $or: [{ to: 'ALL' }, { to: userId }, { to: { $in: [userId] } }]
            },
            { $set: { read: true } }
        );

        res.json({ message: "All notifications marked read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

