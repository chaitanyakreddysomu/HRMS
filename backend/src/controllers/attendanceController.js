const Attendance = require('../models/Attendance');
const { getISTParts, istTimeString, istTodayRange, istTimeStringToUTC, istToUTC } = require('../utils/istTime');

// Helper to get start and end of today, as an IST calendar day
const getTodayRange = () => istTodayRange();

exports.punchIn = async (req, res) => {
    try {
        const { start, end } = getTodayRange();

        // Check if already punched in today
        const existing = await Attendance.findOne({
            userId: req.user.id,
            date: { $gte: start, $lte: end }
        });

        if (existing) {
            return res.status(400).json({ message: "Already punched in for today" });
        }

        const now = new Date();
        const { hour, minute } = getISTParts(now);

        // Determine status (Late if after 9:30 AM IST)
        let status = 'Present';
        if (hour > 9 || (hour === 9 && minute > 30)) {
            status = 'Late';
        }

        const punchInTime = istTimeString(now); // HH:MM:SS, IST

        const record = new Attendance({
            userId: req.user.id,
            date: now,
            punchIn: punchInTime,
            status: status,
            locationIn: req.body.location
        });

        await record.save();
        res.status(201).json(record);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.punchOut = async (req, res) => {
    try {
        const { start, end } = getTodayRange();
        const record = await Attendance.findOne({
            userId: req.user.id,
            date: { $gte: start, $lte: end }
        });

        if (!record) {
            return res.status(404).json({ message: "No punch-in record found for today" });
        }

        if (record.punchOut) {
            return res.status(400).json({ message: "Already punched out for today" });
        }

        const now = new Date();
        const punchOutTime = istTimeString(now);

        // Calculate total hours
        const inDate = istTimeStringToUTC(record.punchIn, now);
        const outDate = istTimeStringToUTC(punchOutTime, now);

        const diffMs = outDate - inDate;
        const totalHours = diffMs / (1000 * 60 * 60);

        record.punchOut = punchOutTime;
        record.locationOut = req.body.location;
        record.totalHours = parseFloat(totalHours.toFixed(2));

        await record.save();
        res.json(record);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTodayStatus = async (req, res) => {
    try {
        const { start, end } = getTodayRange();
        const record = await Attendance.findOne({
            userId: req.user.id,
            date: { $gte: start, $lte: end }
        });
        res.json(record || null); // Return null vs 404 for cleaner frontend check
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // TODAY
        const { start: startToday, end: endToday } = getTodayRange();
        const todayRecord = await Attendance.findOne({
            userId,
            date: { $gte: startToday, $lte: endToday }
        });

        let todayHours = 0;
        if (todayRecord && todayRecord.punchIn && !todayRecord.punchOut) {
            // Live calculation if punch in but not out
            const inTime = istTimeStringToUTC(todayRecord.punchIn, now);
            const diffMs = now - inTime;
            todayHours = diffMs / (1000 * 60 * 60);
        } else if (todayRecord) {
            todayHours = todayRecord.totalHours || 0;
        }

        // WEEK (start from last Monday, in IST) and MONTH, both as real UTC instants
        const { year, month, day } = getISTParts(now);
        const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 (Sun) to 6 (Sat)
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const startOfWeek = istToUTC(year, month, day + mondayOffset);
        const startOfMonth = istToUTC(year, month, 1);

        // Aggregation for Week and Month
        const stats = await Attendance.aggregate([
            {
                $match: {
                    userId: userId,
                    date: { $gte: startOfMonth } // Optimization: Filter from month start (since week is usually within month or close)
                }
            },
            {
                $project: {
                    date: 1,
                    totalHours: 1
                }
            }
        ]);

        let weekHours = 0;
        let monthHours = 0;

        stats.forEach(rec => {
            const d = new Date(rec.date);
            const h = rec.totalHours || 0;

            // Month Total (already filtered >= startOfMonth)
            if (d >= startOfMonth) {
                monthHours += h;
            }

            // Week Total
            if (d >= startOfWeek) {
                weekHours += h;
            }
        });

        // Add today's live hours if relevant (usually totalHours is updated on punchOut, so if running, add it to stats)
        // If punchOut is null, it's not in 'stats' aggregation results as valid completed hours usually? 
        // Actually our model stores totalHours on punchOut. 
        // So if currently punched In, we should add 'todayHours' to week/month totals if we want "live" stats.
        if (todayRecord && !todayRecord.punchOut) {
            monthHours += todayHours;
            weekHours += todayHours;
        }

        res.json({
            today: parseFloat(todayHours.toFixed(2)),
            week: parseFloat(weekHours.toFixed(2)),
            month: parseFloat(monthHours.toFixed(2))
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAttendance = async (req, res) => {
    try {
        const query = (req.user.role === 'EMPLOYEE' || req.query.self === 'true') ? { userId: req.user.id } : {};

        // Month filter (0-11) and Year
        if (req.query.month && req.query.year) {
            const year = parseInt(req.query.year);
            const month = parseInt(req.query.month); // 0-indexed assumed from frontend, in IST

            const start = istToUTC(year, month + 1, 1);
            const nextMonthStart = istToUTC(year, month + 2, 1);

            query.date = { $gte: start, $lt: nextMonthStart };
        } else if (req.query.date) {
            // "YYYY-MM-DD" is an IST calendar day, not a UTC one
            const [y, m, day] = String(req.query.date).split('-').map(Number);
            const start = istToUTC(y, m, day);
            const nextDay = istToUTC(y, m, day + 1);
            query.date = { $gte: start, $lt: nextDay };
        }

        const records = await Attendance.find(query).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateAttendance = async (req, res) => {
    try {
        const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
