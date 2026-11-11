const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger (dev only)
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/batches', require('./routes/batchRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/test-attempts', require('./routes/testAttemptRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Excellup API running' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;

