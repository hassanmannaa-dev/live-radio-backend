// Error handling middleware
function errorHandler(err, req, res, next) {
  console.error("Error stack:", err.stack);

  // Default error status
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation error";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid data format";
  } else if (err.code === "ENOENT") {
    status = 404;
    message = "Resource not found";
  }

  // Send error response
  res.status(status).json({
    error: true,
    message: message,
    status: status,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
}

// 404 handler
function notFoundHandler(req, res) {
  res.status(404).json({
    error: true,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "GET /",
      "GET /health",
      "GET /api/radio/status",
      "GET /api/radio/stream",
      "POST /api/queue",
      "GET /api/queue",
      "GET /api/search",
    ],
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
