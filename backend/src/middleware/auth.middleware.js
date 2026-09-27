const jwt = require('jsonwebtoken');

// Verify JWT token
const authenticateToken = (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE ===');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  
  const authHeader = req.headers['authorization'];
  console.log('Auth Header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  console.log('Token extracted:', token ? 'YES' : 'NO');

  if (!token) {
    console.log('AUTH FAILED: No token');
    return res.status(401).json({
      status: 'error',
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('AUTH FAILED: Token verification error:', err.message);
      return res.status(403).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }
    console.log('AUTH SUCCESS: User:', user);
    req.user = user;
    next();
  });
};

// Check if user is faculty
const isFaculty = (req, res, next) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Faculty only.'
    });
  }
  next();
};

// Check if user is student
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Student only.'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  isFaculty,
  isStudent
};
