const express = require("express");

function createUserRoutes(userController) {
  const router = express.Router();

  router.post("/register", userController.registerUser);
  router.get("/online", userController.getOnlineUsersEndpoint);
  // router.get("/:userId", userController.getUserInfo);
  router.get("/chat/history", userController.getChatHistoryEndpoint);

  return router;
}

module.exports = createUserRoutes;
