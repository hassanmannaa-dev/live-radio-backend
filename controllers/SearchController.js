const YouTubeService = require("../services/YouTubeService");

class SearchController {
  // Search for songs on YouTube Music
  searchSongs = async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      if (query.trim().length < 2) {
        return res
          .status(400)
          .json({ error: "Search query must be at least 2 characters long" });
      }

      console.log(`🔍 Searching for: ${query}`);

      // Search for the song
      const song = await YouTubeService.searchSong(query);

      if (!song.isValid()) {
        return res
          .status(404)
          .json({ error: "No valid songs found for this query" });
      }

      res.json({
        message: "Search completed",
        result: song.getInfo(),
        query: query,
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({
        error: "Failed to search for songs",
        message: error.message,
      });
    }
  };

  // Get song info by ID
  getSongInfo = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "Song ID is required" });
      }

      console.log(`📋 Getting info for song ID: ${id}`);

      // Get song information
      const song = await YouTubeService.getSongInfo(id);

      if (!song.isValid()) {
        return res.status(404).json({ error: "Song not found or invalid" });
      }

      res.json({
        message: "Song info retrieved",
        song: song.getInfo(),
      });
    } catch (error) {
      console.error("Get song info error:", error);
      res.status(500).json({
        error: "Failed to get song information",
        message: error.message,
      });
    }
  };

  // Validate YouTube URL
  validateUrl = (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const isValid = YouTubeService.isValidYouTubeUrl(url);
      const videoId = isValid ? YouTubeService.extractVideoId(url) : null;

      res.json({
        isValid,
        videoId,
        url,
      });
    } catch (error) {
      console.error("URL validation error:", error);
      res.status(500).json({ error: "Failed to validate URL" });
    }
  };
}

module.exports = SearchController;
