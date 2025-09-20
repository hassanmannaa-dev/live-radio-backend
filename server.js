require("dotenv").config();

// Import configuration and middleware
const { createAppServer, setupMiddleware } = require("./config/server");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const setupSocketHandlers = require("./middleware/socketHandler");
const setupRoutes = require("./routes");

// Import controllers
const RadioController = require("./controllers/RadioController");
const QueueController = require("./controllers/QueueController");
const SearchController = require("./controllers/SearchController");
const UserController = require("./controllers/UserController");

// Server configuration
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Create Express app and HTTP server with Socket.IO
    const { app, server, io } = createAppServer();

    // Setup middleware
    setupMiddleware(app);

    // Initialize controllers
    const radioController = new RadioController(io);
    const queueController = new QueueController(radioController, io);
    const searchController = new SearchController();
    const userController = new UserController(io);

    const controllers = {
      radioController,
      queueController,
      searchController,
      userController,
    };

    // Setup routes
    setupRoutes(app, controllers);

    // Setup Socket.IO handlers
    setupSocketHandlers(io, radioController, userController);

    // Error handling middleware (must be last)
    app.use(errorHandler);
    app.use("*", notFoundHandler);

    // Start server
    server.listen(PORT, () => {
      console.log("🚀 ================================");
      console.log(`🚀 Live Radio Backend Server v2.0.0`);
      console.log(`🚀 Port: ${PORT}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🚀 Architecture: MVC`);
      console.log("🚀 ================================");
      console.log("📡 Live Radio Station ready");
      console.log("🎵 WebSocket enabled for real-time sync");
      console.log("🔗 API Endpoints:");
      console.log("   - GET  /api/radio/status");
      console.log("   - GET  /api/radio/stream");
      console.log("   - POST /api/queue");
      console.log("   - GET  /api/queue");
      console.log("   - GET  /api/search");
      console.log("   - POST /api/user/register");
      console.log("   - POST /api/user/setup");
      console.log("   - GET  /api/user/online");
      console.log("   - GET  /health");
      console.log("🚀 ================================");
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("🛑 SIGTERM received, shutting down gracefully");
      radioController.stop();
      server.close(() => {
        console.log("🛑 Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("🛑 SIGINT received, shutting down gracefully");
      radioController.stop();
      server.close(() => {
        console.log("🛑 Server closed");
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = startServer;
