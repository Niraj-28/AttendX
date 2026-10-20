const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Make io globally available for controllers
global.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Faculty joins session room to receive real-time updates
  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`📱 Socket ${socket.id} joined session-${sessionId}`);
  });

  // Faculty leaves session room
  socket.on('leave-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
    console.log(`📱 Socket ${socket.id} left session-${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve uploaded files (for local storage only)
if (process.env.USE_LOCAL_STORAGE === 'true') {
  const uploadsPath = path.join(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log('📁 Serving static files from:', uploadsPath);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AttendX Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API base route
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AttendX API v1.0',
    endpoints: {
      auth: '/api/auth',
      students: '/api/students',
      sessions: '/api/sessions',
      attendance: '/api/attendance'
    }
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/sessions', require('./routes/session.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/subjects', require('./routes/subject.routes'));
app.use('/api/phone-capture', require('./routes/phone-capture.routes')); // NEW: Phone camera capture

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🚀 AttendX Backend Server Started   ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n📡 Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = { app, server, io };
