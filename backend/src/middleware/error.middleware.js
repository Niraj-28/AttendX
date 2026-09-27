// Global error handling middleware

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired'
    });
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      status: 'error',
      message: `Upload error: ${err.message}`
    });
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate entry. Record already exists.'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
