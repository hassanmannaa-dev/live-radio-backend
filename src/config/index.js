const cors = require('cors');
const morgan = require('morgan');
const express = require('express');

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOptions: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
    credentials: true
  }
};

function setupMiddleware(app) {
  // CORS
  app.use(cors(config.corsOptions));

  // Request logging
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
}

module.exports = {
  config,
  setupMiddleware
};
