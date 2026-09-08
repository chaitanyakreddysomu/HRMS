const User = require('../models/User');
const Notification = require('../models/Notification');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * ============================================================
 * EXPO PUSH
 * ============================================================
 *
 * The mobile app registers Expo push tokens. They are delivered
 * through Expo's service rather than Firebase, so this lives
 * beside the FCM path instead of replacing it: browsers keep
 * getting FCM, phones get Expo, and both are sent for a user who
 * has registered on each.
 */
const sendExpoPush = async (tokens, payload) => {
    const valid = [...new Set((tokens || []).filter(
        (t) => typeof t === 'string' && t.startsWith('ExponentPushToken')
    ))];

    if (!valid.length) return { sent: 0, dropped: [] };

    // Expo accepts up to 100 messages per request
    const chunks = [];
    for (let i = 0; i < valid.length; i += 100) {
        chunks.push(valid.slice(i, i + 100));
    }

    const dropped = [];

    for (const chunk of chunks) {
        const messages = chunk.map((to) => ({
            to,
            sound: 'default',
            title: payload.title,
            body: payload.body || payload.message,
            // What the app reads on a tap to open the right page
            data: {
                notificationId: payload.notificationId || null,
                category: payload.category || 'general',
                entityId: payload.entityId || null,
                screen: 'notifications',
                // Normally the app keeps a foreground arrival in its own
                // header. This asks for the system tray regardless.
                forceSystem: !!payload.forceSystem
            },
            priority: 'high',
            channelId: 'default'
        }));

        try {
            const res = await fetch(EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'Accept-Encoding': 'gzip, deflate'
                },
                body: JSON.stringify(messages)
            });

            const body = await res.json().catch(() => null);
            const tickets = body?.data || [];

            // A token Expo no longer recognises is worth forgetting
            tickets.forEach((ticket, index) => {
                if (
                    ticket?.status === 'error' &&
                    ticket?.details?.error === 'DeviceNotRegistered'
                ) {
                    dropped.push(chunk[index]);
                }
            });
        } catch (error) {
            console.error('Expo push send error:', error.message);
        }
    }

    if (dropped.length) {
        await User.updateMany(
            { 'expoPushTokens.token': { $in: dropped } },
            { $pull: { expoPushTokens: { token: { $in: dropped } } } }
        );
    }

    return { sent: valid.length - dropped.length, dropped };
};

/** Every Expo token registered against one user id. */
const expoTokensFor = async (userId) => {
    if (userId === 'ALL') {
        const users = await User.find({ status: 'Active' }).select('expoPushTokens');
        return users.flatMap((u) => (u.expoPushTokens || []).map((t) => t.token));
    }

    const user = await User.findOne({ id: userId }).select('expoPushTokens');
    return (user?.expoPushTokens || []).map((t) => t.token);
};

/** The same, for Firebase, so browsers are not left out. */
const sendFcmPush = async (userId, payload, notificationId) => {
    try {
        const admin = require('../config/firebase');
        if (!admin || typeof admin.messaging !== 'function') return;

        let tokens = [];

        if (userId === 'ALL') {
            const users = await User.find({ status: 'Active' }).select('fcmTokens');
            tokens = users.flatMap((u) => (u.fcmTokens || []).map((t) => t.token));
        } else {
            const user = await User.findOne({ id: userId }).select('fcmTokens');
            tokens = (user?.fcmTokens || []).map((t) => t.token);
        }

        const unique = [...new Set(tokens.filter(Boolean))];
        if (!unique.length) return;

        const response = await admin.messaging().sendEachForMulticast({
            notification: { title: payload.title, body: payload.body },
            data: {
                notificationId: String(notificationId || ''),
                category: String(payload.category || 'general'),
                entityId: String(payload.entityId || ''),
                screen: 'notifications',
                forceSystem: String(!!payload.forceSystem)
            },
            tokens: unique
        });

        if (response.failureCount > 0) {
            const bad = [];

            response.responses.forEach((resp, index) => {
                const code = resp.error?.code;

                if (
                    code === 'messaging/registration-token-not-registered' ||
                    code === 'messaging/invalid-registration-token' ||
                    code === 'messaging/third-party-auth-error'
                ) {
                    bad.push(unique[index]);
                }
            });

            if (bad.length) {
                await User.updateMany(
                    { 'fcmTokens.token': { $in: bad } },
                    { $pull: { fcmTokens: { token: { $in: bad } } } }
                );
            }
        }
    } catch (error) {
        console.error('FCM push send error:', error.message);
    }
};

/**
 * Writes the notification to the database, then pushes it to every
 * device that user has registered, browser and phone alike. One
 * call is all a caller needs to notify somebody.
 */
const notifyUser = async (userId, payload) => {
    try {
        // Recipients are matched on User.id ("EMP004"). A Mongo _id here
        // stores a notification nobody can read and pushes it to nobody,
        // so say so rather than fail silently.
        const recipient = String(userId ?? '');

        if (/^[0-9a-f]{24}$/i.test(recipient)) {
            const owner = await User.findById(recipient).select('id');

            if (!owner) {
                console.error('notifyUser: unknown recipient _id', recipient);
                return null;
            }

            console.warn(
                `notifyUser: given a Mongo _id (${recipient}), using ${owner.id}`
            );

            userId = owner.id;
        }

        const record = await Notification.create({
            title: payload.title,
            message: payload.body || payload.message,
            to: userId,
            source: payload.source || 'SYSTEM',
            type: payload.type || 'info',
            category: payload.category || 'general',
            entityId: payload.entityId ? String(payload.entityId) : undefined,
            date: new Date()
        });

        const withId = { ...payload, notificationId: String(record._id) };

        const tokens = await expoTokensFor(userId);

        await Promise.all([
            sendExpoPush(tokens, withId),
            sendFcmPush(userId, withId, record._id)
        ]);

        return record;
    } catch (error) {
        console.error('notifyUser error:', error.message);
        return null;
    }
};

/** Notifies everyone holding one of the given roles. */
const notifyRoles = async (roles, payload) => {
    try {
        const users = await User.find({
            role: { $in: roles },
            status: 'Active'
        }).select('id');

        await Promise.all(users.map((u) => notifyUser(u.id, payload)));
    } catch (error) {
        console.error('notifyRoles error:', error.message);
    }
};

module.exports = { sendExpoPush, sendFcmPush, notifyUser, notifyRoles, expoTokensFor };
