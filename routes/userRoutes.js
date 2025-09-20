const express = require("express");
const router = express.Router();

function createUserRoutes(userController) {
  // Register a new user
  router.post("/register", userController.registerUser);

  // Get online users
  router.get("/online", userController.getOnlineUsersEndpoint);

  // Get user info by ID
  router.get("/:userId", userController.getUserInfo);

  // User setup endpoint (for frontend compatibility)
  router.post("/setup", userController.registerUser);

  return router;
}

module.exports = createUserRoutes;
