function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
}

function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
