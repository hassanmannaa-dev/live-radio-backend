const express = require('express');

function createRadioRoutes(radioController) {
  const router = express.Router();

  router.get('/status', radioController.getStatus);
  router.get('/stream', radioController.stream);
  router.post('/stop', radioController.stop);

  return router;
}

module.exports = createRadioRoutes;
