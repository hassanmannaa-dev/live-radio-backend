const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createServer } = require("http");
const { Server } = require("socket.io");

function createAppServer() {
  const app = express();
  const server = createServer(app);

  // Socket.IO setup
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  return { app, server, io };
}

function setupMiddleware(app) {
  // CORS middleware
  app.use(cors());

  // Logging middleware
  app.use(morgan("combined"));

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
}

module.exports = {
  createAppServer,
  setupMiddleware,
};
