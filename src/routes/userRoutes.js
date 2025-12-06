const express = require('express');

function createUserRoutes(userController) {
  const router = express.Router();

  router.post('/register', userController.register);
  router.get('/online', userController.getOnlineUsers);
  router.get('/chat/history', userController.getChatHistory);
  router.get('/:userId', userController.getUserById);

  return router;
}

module.exports = createUserRoutes;
