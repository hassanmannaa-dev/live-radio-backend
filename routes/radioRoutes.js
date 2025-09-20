const express = require("express");
const router = express.Router();

function createRadioRoutes(radioController) {
  // Get current radio status
  router.get("/status", radioController.getStatus);

  // Stream the current radio audio
  router.get("/stream", radioController.getStream);

  // Stop radio playback (admin only)
  router.post("/stop", radioController.stop);

  return router;
}

module.exports = createRadioRoutes;
