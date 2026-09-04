const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPushToUser } = require('./notificationController');

exports.getTodayBirthdays = async (req, res) => {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        // Trigger notification check when birthdays are fetched
        // This ensures notifications are sent at least once per day when someone views the tab
        await exports.checkAndSendBirthdayNotifications();

        // range=month -> today through the last day of the current month
        if (req.query.range === 'month') {
            const lastDay = new Date(today.getFullYear(), month, 0).getDate();

            const upcoming = await User.find({
                $expr: {
                    $and: [
                        { $eq: [{ $month: '$dob' }, month] },
                        { $gte: [{ $dayOfMonth: '$dob' }, day] },
                        { $lte: [{ $dayOfMonth: '$dob' }, lastDay] }
                    ]
                },
                status: 'Active'
            }).select('id name email role designation department profileImage dob');

            const sorted = upcoming.sort(
                (a, b) => new Date(a.dob).getDate() - new Date(b.dob).getDate()
            );

            return res.json(sorted);
        }

        // MongoDB query to match month and day of dob
        const birthdays = await User.find({
            $expr: {
                $and: [
                    { $eq: [{ $month: '$dob' }, month] },
                    { $eq: [{ $dayOfMonth: '$dob' }, day] }
                ]
            },
            status: 'Active'
        }).select('id name email role designation department profileImage dob');

        res.json(birthdays);
    } catch (error) {
        console.error("Get Birthdays Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// This could be called daily by a cron job or triggered by an admin
exports.checkAndSendBirthdayNotifications = async () => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const month = today.getMonth() + 1;
        const day = today.getDate();

        const birthdayEmployees = await User.find({
            $expr: {
                $and: [
                    { $eq: [{ $month: '$dob' }, month] },
                    { $eq: [{ $dayOfMonth: '$dob' }, day] }
                ]
            },
            status: 'Active'
        });

        for (const employee of birthdayEmployees) {
            // Check if notification already sent today to avoid duplicates
            const existingNotification = await Notification.findOne({
                to: employee.id,
                title: 'Happy Birthday! 🎂',
                date: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            });

            if (!existingNotification) {
                const notification = new Notification({
                    to: employee.id,
                    from: 'System',
                    title: 'Happy Birthday! 🎂',
                    message: `Wishing you a very Happy Birthday, ${employee.name}! Have a wonderful day!`,
                    type: 'System',
                    read: false,
                    date: new Date()
                });
                await notification.save();

                // Send push notification
                const payload = {
                    title: notification.title,
                    body: notification.message
                };
                await sendPushToUser(employee.id, payload);
            }
        }
    } catch (error) {
        console.error("Birthday Notification Error:", error);
    }
};

