const express = require('express');

function createQueueRoutes(queueController) {
  const router = express.Router();

  router.post('/', queueController.addSong);
  router.get('/', queueController.getPlaylist);
  router.delete('/:index', queueController.removeSong);
  router.delete('/', queueController.clearPlaylist);

  return router;
}

module.exports = createQueueRoutes;
