const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars immediately
dotenv.config();

const { connectDB } = require('./db');
const compression = require('compression');
require('./config/firebase'); // Init Firebase Admin

const app = express();

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Health check (used by mobile app to resolve the correct backend URL)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('ICS HRMS API is running');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/employee', require('./routes/employee'));

app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payslips', require('./routes/payslips'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/birthdays', require('./routes/birthdayRoutes'));
app.use('/api/referrals', require('./routes/referralRoutes'));
app.use('/api/theme', require('./routes/themeRoutes'));

const PORT = process.env.PORT || 5000;

// The current Wi-Fi/Ethernet address, read at boot so the banner never
// points the mobile app at a stale IP after the network changes.
function lanAddress() {
    const nets = require('os').networkInterfaces();
    for (const addrs of Object.values(nets)) {
        for (const a of addrs || []) {
            if (a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.')) {
                return a.address;
            }
        }
    }
    return 'localhost';
}

// Bind every interface, not just localhost, so a phone on the same
// Wi-Fi can reach this over the LAN IP the mobile app is pointed at.
app.listen(PORT, '0.0.0.0', () =>
    console.log(`Server running on port ${PORT} (LAN: http://${lanAddress()}:${PORT})`)
);
