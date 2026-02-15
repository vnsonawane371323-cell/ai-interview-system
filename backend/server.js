const path = require("path");
const dns = require("dns");
// Use Google DNS to avoid SRV lookup failures on some networks
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import routes
const authRoutes = require('./routes/auth');
const interviewSessionRoutes = require('./routes/interviewSession');

const app = express();

// ============ MIDDLEWARE ============
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Allow any localhost port in development
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
        // Allow Vercel deployments
        if (/\.vercel\.app$/.test(origin)) return callback(null, true);
        // Allow configured origins
        if (process.env.CORS_ORIGIN) {
            const allowed = process.env.CORS_ORIGIN.split(',');
            if (allowed.includes(origin)) return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============ DATABASE CONNECTION (serverless-safe) ============
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not set.");
        throw new Error("MONGO_URI environment variable is not configured");
    }

    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
        });
        isConnected = true;
        console.log("✅ MongoDB Connected Successfully!");
    } catch (err) {
        console.error(`❌ MongoDB Connection Error: ${err.message}`);
        isConnected = false;
        throw err;
    }
};

// Middleware: ensure DB is connected before handling any API request
app.use('/api', async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ 
            message: "Database connection failed", 
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
        });
    }
});

// ============ API ROUTES ============
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "AI Interview Backend is Running", dbConnected: isConnected });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Interview session routes (protected)
app.use('/api/interview', interviewSessionRoutes);

// ============ 404 HANDLER for API routes ============
app.all('/api/{*splat}', (req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// ============ SERVE FRONTEND IN PRODUCTION (local only) ============
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
} else if (!process.env.VERCEL) {
    app.get("/", (req, res) => {
        res.json({ message: "AI Interview Backend is Running ✅ (Development Mode)" });
    });
}

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

// ============ START SERVER (only when not in serverless mode) ============
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📡 Routes available at http://localhost:${PORT}/api/auth`);
    });
}

// Export for Vercel serverless
module.exports = app;

