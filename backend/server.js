require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Import routes
const authRoutes = require('./routes/auth');
const interviewRoutes = require('./routes/interview');

const app = express();

// ============ MIDDLEWARE ============
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ API ROUTES ============
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "AI Interview Backend is Running" });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Interview routes (protected)
app.use('/api/interviews', interviewRoutes);

// ============ SERVE FRONTEND IN PRODUCTION ============
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
} else {
    app.get("/", (req, res) => {
        res.json({ message: "AI Interview Backend is Running ✅ (Development Mode)" });
    });
}

// ============ 404 HANDLER ============
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
});

// ============ DATABASE CONNECTION ============
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("❌ MONGO_URI not set. Please add it to your .env file.");
    process.exit(1);
}

let retries = 5;
const connectWithRetry = () => {
    mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
    })
    .then(() => {
        console.log("✅ MongoDB Connected Successfully!");
        retries = 5;
    })
    .catch((err) => {
        retries -= 1;
        console.error(`❌ MongoDB Connection Error: ${err.message}`);
        if (retries > 0) {
            console.log(`⏳ Retrying in 5 seconds... (${retries} attempts left)`);
            setTimeout(connectWithRetry, 5000);
        } else {
            console.error("❌ Failed to connect to MongoDB after 5 attempts.");
            process.exit(1);
        }
    });
};

connectWithRetry();

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Routes available at http://localhost:${PORT}/api/auth`);
});

