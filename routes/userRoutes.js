const express = require("express");
const router = express.Router();

function createUserRoutes(userController) {
  // Register a new user
  router.post("/register", userController.registerUser);

  // Get online users
  router.get("/online", userController.getOnlineUsersEndpoint);

  // Get user info by ID
  router.get("/:userId", userController.getUserInfo);

  // Get chat history
  router.get("/chat/history", userController.getChatHistoryEndpoint);

  // User setup endpoint (for frontend compatibility)
  router.post("/setup", userController.registerUser);

  return router;
}

module.exports = createUserRoutes;
