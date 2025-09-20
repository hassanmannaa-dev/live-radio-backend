const express = require("express");
const createRadioRoutes = require("./radioRoutes");
const createQueueRoutes = require("./queueRoutes");
const createSearchRoutes = require("./searchRoutes");
const createUserRoutes = require("./userRoutes");

function setupRoutes(app, controllers) {
  const { radioController, queueController, searchController, userController } =
    controllers;

  // API Routes
  app.use("/api/radio", createRadioRoutes(radioController));
  app.use("/api/queue", createQueueRoutes(queueController));
  app.use("/api/search", createSearchRoutes(searchController));
  app.use("/api/user", createUserRoutes(userController));

  // Legacy routes for backward compatibility
  app.use("/radio", createRadioRoutes(radioController));
  app.use("/queue", createQueueRoutes(queueController));
  app.use("/search", createSearchRoutes(searchController));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "live-radio-backend",
      version: "2.0.0",
    });
  });

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      message: "Live Radio Backend API",
      version: "2.0.0",
      status: "running",
      architecture: "MVC",
      endpoints: {
        radio: "/api/radio",
        queue: "/api/queue",
        search: "/api/search",
        user: "/api/user",
        health: "/health",
      },
    });
  });

  // API Routes placeholder for future expansion
  app.use("/api", (req, res) => {
    res.status(404).json({
      error: "API endpoint not found",
      endpoint: req.originalUrl,
      availableEndpoints: [
        "/api/radio",
        "/api/queue",
        "/api/search",
        "/api/user",
      ],
    });
  });
}

module.exports = setupRoutes;
