const express = require("express");
const router = express.Router();
const searchController = require("../controllers/SongController");

router.get("/", searchController.searchSongs);
router.get("/multiple", searchController.searchMultipleSongs);
router.get("/song/:id", searchController.getSongInfo);
router.post("/validate", searchController.validateUrl);

module.exports = router;
