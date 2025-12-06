require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const { config, setupMiddleware } = require('./config');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const createRoutes = require('./routes');
const createSocketHandler = require('./socket/socketHandler');

// Import Services
const {
  UserService,
  RadioService,
  QueueService,
  ChatService,
  StreamingService
} = require('./services');

// Import Controllers
const {
  UserController,
  RadioController,
  QueueController,
  SearchController
} = require('./controllers');

// Import Models
const Radio = require('./models/Radio');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create Socket.IO instance
const io = new Server(server, {
  cors: config.corsOptions
});

// Setup middleware
setupMiddleware(app);

// Initialize Services (Dependency Injection)
const radio = new Radio();
const userService = new UserService();
const chatService = new ChatService();
const streamingService = new StreamingService();
const queueService = new QueueService(radio);
const radioService = new RadioService(streamingService, queueService);

const services = {
  userService,
  radioService,
  queueService,
  chatService,
  streamingService
};

// Initialize Controllers
const userController = new UserController(userService, chatService, io);
const radioController = new RadioController(radioService, streamingService, io);
const queueController = new QueueController(queueService, radioService, io);
const searchController = new SearchController();

const controllers = {
  userController,
  radioController,
  queueController,
  searchController
};

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Live Radio Backend',
    version: '1.0.0',
    description: 'Live radio application with YouTube Music streaming',
    endpoints: {
      api: '/api',
      health: '/health'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount API routes
app.use('/api', createRoutes(controllers));

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Setup Socket.IO handlers
createSocketHandler(io, services);

// Start server
server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Stop streaming
  streamingService.stopStream();

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, server, io };
