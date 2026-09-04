const mongoose = require('mongoose');

// Track connection state to prevent multiple connections
let isConnected = false;

const connectDB = async () => {
    // Guard: already connected, skip
    if (isConnected) {
        console.log('MongoDB: reusing existing connection');
        return;
    }

    // Guard: mongoose is already in a connected/connecting state
    if (mongoose.connection.readyState === 1) {
        isConnected = true;
        console.log('MongoDB: connection already open');
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // ── Connection Pool ──────────────────────────────────────
            maxPoolSize: 10,          // max simultaneous connections in the pool
            minPoolSize: 2,           // keep at least 2 connections alive
            maxIdleTimeMS: 30000,     // close idle connections after 30 s

            // ── Timeouts ─────────────────────────────────────────────
            serverSelectionTimeoutMS: 10000, // fail fast if no server found (10 s)
            socketTimeoutMS: 45000,          // close socket if idle for 45 s
            connectTimeoutMS: 10000,         // initial connection timeout

            // ── Reliability ───────────────────────────────────────────
            retryWrites: true,
            retryReads: true,
        });

        isConnected = true;
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // ── Connection lifecycle events ────────────────────────────
        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            console.warn('⚠️  MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            isConnected = true;
            console.log('🔄 MongoDB reconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            isConnected = false;
        });

    } catch (err) {
        console.error('❌ MongoDB initial connection failed:', err);
        process.exit(1);
    }
};

/**
 * Returns the underlying native MongoClient from Mongoose's connection.
 * Use this when you need raw collection access without creating a new client.
 *
 * @returns {import('mongodb').MongoClient}
 */
const getClient = () => {
    if (!isConnected || mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB is not connected. Call connectDB() first.');
    }
    return mongoose.connection.getClient();
};

/**
 * Returns the native MongoDB Db instance for a given database name.
 * Defaults to the database in the connection URI.
 *
 * @param {string} [dbName]
 * @returns {import('mongodb').Db}
 */
const getDb = (dbName) => {
    return getClient().db(dbName);
};

module.exports = { connectDB, getClient, getDb };
