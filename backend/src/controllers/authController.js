const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            await logger.logAction(req, null, 'Auth', 'Login', `Failed login attempt (User not found): ${email}`, 'Error');
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logger.logAction(req, null, 'Auth', 'Login', `Failed login attempt (Invalid password): ${email}`, 'Error');
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check Account Status
        if (user.status === 'Pending') {
            await logger.logAction(req, user, 'Auth', 'Login', `Failed login attempt (Pending Approval): ${email}`, 'Warning');

            const msg = user.role === 'HR'
                ? "You are not approved, please contact admin"
                : "You are not approved, please contact HR";

            return res.status(403).json({ message: msg });
        }

        if (user.status === 'Rejected') {
            await logger.logAction(req, user, 'Auth', 'Login', `Failed login attempt (Rejected): ${email}`, 'Warning');

            const msg = user.role === 'HR'
                ? "You are rejected, please contact admin"
                : "You are rejected, please contact your HR";

            return res.status(403).json({ message: msg });
        }

        // Check Two-Factor Authentication Status
        if (user.twoFactorEnabled) {
            const tempToken = jwt.sign(
                { id: user.id, purpose: '2fa_login', role: user.role, name: user.name, mongoId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );

            return res.json({
                twoFactorRequired: true,
                tempToken,
                email: user.email
            });
        }

        // Generate Tokens
        const accessToken = jwt.sign(
            { id: user.id, role: user.role, name: user.name, mongoId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, role: user.role, name: user.name, mongoId: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // LOG SUCCESS
        await logger.logAction(req, user, 'Auth', 'Login', 'User logged in successfully', 'Success');

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
                avatar: user.avatar,
                profileImage: user.profileImage,
                dob: user.dob
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.refresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Refresh Token required" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Generate new Access Token
        const accessToken = jwt.sign(
            { id: decoded.id, role: decoded.role, name: decoded.name, mongoId: decoded.mongoId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ accessToken });
    } catch (err) {
        console.error(err);
        return res.status(403).json({ message: "Invalid Refresh Token" });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, designation, department, phone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        // Auto-generate ID — only look at EMP-prefixed users
        const lastEmpUser = await User.findOne({ id: /^EMP\d+$/ }).sort({ id: -1 });
        let newId = "EMP001";
        if (lastEmpUser && lastEmpUser.id) {
            const lastIdNum = parseInt(lastEmpUser.id.replace("EMP", ""), 10);
            if (!isNaN(lastIdNum)) {
                newId = `EMP${(lastIdNum + 1).toString().padStart(3, '0')}`;
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            id: newId,
            name,
            email,
            password: hashedPassword,
            role: role || 'EMPLOYEE',
            designation,
            department,
            phone,
            status: 'Pending'
        });

        await newUser.save();

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                designation: newUser.designation,
                department: newUser.department,
                phone: newUser.phone,
                status: newUser.status,
                projectStatus: newUser.projectStatus
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.verify2FALogin = async (req, res) => {
    try {
        const { tempToken, code } = req.body;
        if (!tempToken || !code) {
            return res.status(400).json({ message: "Temp token and code are required" });
        }

        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (decoded.purpose !== '2fa_login') {
            return res.status(401).json({ message: "Invalid session token" });
        }

        const user = await User.findById(decoded.mongoId);
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ message: "Two-Factor authentication not configured" });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid authenticator code" });
        }

        // Generate Tokens
        const accessToken = jwt.sign(
            { id: user.id, role: user.role, name: user.name, mongoId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, role: user.role, name: user.name, mongoId: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        await logger.logAction(req, user, 'Auth', 'Login', 'User logged in successfully (2FA verified)', 'Success');

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
                avatar: user.avatar,
                profileImage: user.profileImage,
                dob: user.dob
            }
        });
    } catch (error) {
        console.error(error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Session expired, please try again" });
        }
        res.status(500).json({ message: "Server Error" });
    }
};

exports.get2FAStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.mongoId);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ twoFactorEnabled: user.twoFactorEnabled });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.setup2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user.mongoId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const secret = speakeasy.generateSecret({
            name: `ICS HRMS (${user.email})`
        });

        // Save secret temporarily but don't enable yet
        user.twoFactorSecret = secret.base32;
        await user.save();

        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            secret: secret.base32,
            qrCodeDataUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.verify2FA = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: "Verification code is required" });

        const user = await User.findById(req.user.mongoId);
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ message: "2FA setup is not initialized" });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        user.twoFactorEnabled = true;
        await user.save();

        await logger.logAction(req, user, 'Auth', '2FA', 'Two-Factor Authentication (TOTP) enabled successfully', 'Success');

        res.json({ message: "Two-Factor Authentication enabled successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.disable2FA = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: "Verification code is required" });

        const user = await User.findById(req.user.mongoId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ message: "Two-Factor Authentication is not enabled" });
        }

        // Turning the protection off is as sensitive as turning it on,
        // so it needs a current code from the same authenticator.
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!verified) {
            await logger.logAction(req, user, 'Auth', '2FA', 'Two-Factor Authentication disable rejected: invalid code', 'Failed');
            return res.status(400).json({ message: "Invalid verification code" });
        }

        user.twoFactorSecret = undefined;
        user.twoFactorEnabled = false;
        await user.save();

        await logger.logAction(req, user, 'Auth', '2FA', 'Two-Factor Authentication disabled', 'Success');

        res.json({ message: "Two-Factor Authentication disabled successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

