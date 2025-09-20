const express = require("express");
const router = express.Router();

function createQueueRoutes(queueController) {
  // Add song to queue
  router.post("/", queueController.addToQueue);

  // Get current playlist
  router.get("/", queueController.getPlaylist);

  // Remove song from queue by index
  router.delete("/:index", queueController.removeFromQueue);

  // Clear entire playlist
  router.delete("/", queueController.clearPlaylist);

  return router;
}

module.exports = createQueueRoutes;
