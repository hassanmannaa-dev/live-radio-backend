const express = require("express");

function createQueueRoutes(queueController) {
  const router = express.Router();

  router.post("/", queueController.addToQueue);
  router.get("/", queueController.getPlaylist);
  router.delete("/:index", queueController.removeFromQueue);
  router.delete("/", queueController.clearPlaylist);

  return router;
}

module.exports = createQueueRoutes;
