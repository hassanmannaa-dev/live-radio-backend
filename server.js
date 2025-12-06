require("dotenv").config();

const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const setupSocketHandlers = require("./middleware/socketHandler");
const { createUserController } = require("./controllers/UserController");
const { createQueueController } = require("./controllers/QueueController");
const createUserRoutes = require("./routes/userRoutes");
const createQueueRoutes = require("./routes/queueRoutes");
const searchRoutes = require("./routes/searchRoutes");
const cors = require("cors");
const morgan = require("morgan");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 5000;

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());

app.use(morgan("combined"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Create controllers with io for real-time features
const userController = createUserController(io);
const queueController = createQueueController(io);

setupSocketHandlers(io, userController);

app.use("/api/user", createUserRoutes(userController));
app.use("/api/queue", createQueueRoutes(queueController));
app.use("/api/search", searchRoutes);

app.use("*", notFoundHandler);
app.use(errorHandler);

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
  console.log("   - POST /api/queue");
  console.log("   - GET  /api/queue");
  console.log("   - GET  /api/search");
  console.log("   - POST /api/user/register");
  console.log("   - GET  /api/user/chat/history");
  console.log("   - GET  /api/user/online");
  console.log("   - GET  /health");
  console.log("🚀 ================================");
});

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("🛑 Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("🛑 Server closed");
    process.exit(0);
  });
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
