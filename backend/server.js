const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: __dirname + '/.env' });

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/resume', require('./routes/resumeRoutes'));
app.use('/api/apply', require('./routes/applyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));

// Health check
app.get('/api/healthz', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🚀 NaukriQuest AI Server running on http://localhost:${PORT}`);
    console.log(`📡 MongoDB: Connected`);
    console.log(`🤖 Cloudflare AI: ${process.env.CF_API_TOKEN ? 'Ready' : 'Missing key'}\n`);
  });
}

module.exports = app;
