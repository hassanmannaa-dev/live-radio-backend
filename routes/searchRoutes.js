const express = require("express");
const router = express.Router();

function createSearchRoutes(searchController) {
  // Search for songs
  router.get("/", searchController.searchSongs);

  // Get song info by ID
  router.get("/song/:id", searchController.getSongInfo);

  // Validate YouTube URL
  router.post("/validate", searchController.validateUrl);

  return router;
}

module.exports = createSearchRoutes;
