const SongService = require("../services/SongService");

// State management functions
function createSongControllerState() {
  return {
    searchHistory: [], // Track search history if needed
    lastSearchTime: null,
  };
}

// Search for songs on YouTube Music
function searchSongs(state) {
  return async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Search query is required",
        });
      }

      if (query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search query must be at least 2 characters long",
        });
      }

      console.log(`🔍 Searching for: ${query}`);

      // Update state
      state.lastSearchTime = new Date();
      state.searchHistory.push({ query, timestamp: state.lastSearchTime });

      // Search for the song
      const song = await SongService.searchSong(query);

      if (!song.isValid()) {
        return res.status(404).json({
          success: false,
          error: "No valid songs found for this query",
        });
      }

      res.json({
        success: true,
        message: "Search completed",
        result: song.getInfo(),
        query: query,
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search for songs",
        message: error.message,
      });
    }
  };
}

// Search for multiple songs on YouTube Music
function searchMultipleSongs(state) {
  return async (req, res) => {
    try {
      const { query, limit } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Search query is required",
        });
      }

      if (query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search query must be at least 2 characters long",
        });
      }

      const searchLimit = Math.min(parseInt(limit) || 3); // Max 3 results by default
      console.log(
        `🔍 Searching for multiple songs: ${query} (limit: ${searchLimit})`
      );

      // Update state
      state.lastSearchTime = new Date();
      state.searchHistory.push({
        query,
        limit: searchLimit,
        type: "multiple",
        timestamp: state.lastSearchTime,
      });

      // Search for multiple songs
      const songs = await SongService.searchMultipleSongs(query, searchLimit);

      if (songs.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No valid songs found for this query",
        });
      }

      res.json({
        success: true,
        message: "Search completed",
        results: songs.map((song) => song.getInfo()),
        count: songs.length,
        query: query,
      });
    } catch (error) {
      console.error("Multiple search error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search for songs",
        message: error.message,
      });
    }
  };
}

// Get song info by ID
function getSongInfo(state) {
  return async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Song ID is required",
        });
      }

      console.log(`📋 Getting info for song ID: ${id}`);

      // Get song information
      const song = await SongService.getSongInfo(id);

      if (!song.isValid()) {
        return res.status(404).json({
          success: false,
          error: "Song not found or invalid",
        });
      }

      res.json({
        success: true,
        message: "Song info retrieved",
        song: song.getInfo(),
      });
    } catch (error) {
      console.error("Get song info error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get song information",
        message: error.message,
      });
    }
  };
}

// Validate YouTube URL
function validateUrl(state) {
  return (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: "URL is required",
        });
      }

      const isValid = SongService.isValidYouTubeUrl(url);
      const videoId = isValid ? SongService.extractVideoId(url) : null;

      res.json({
        success: true,
        isValid,
        videoId,
        url,
      });
    } catch (error) {
      console.error("URL validation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to validate URL",
      });
    }
  };
}

// Get search history
function getSearchHistory(state) {
  return (req, res) => {
    try {
      const { limit } = req.query;
      const historyLimit = Math.min(parseInt(limit) || 10, 50); // Max 50 results

      const recentHistory = state.searchHistory.slice(-historyLimit).reverse(); // Most recent first

      res.json({
        success: true,
        history: recentHistory,
        count: recentHistory.length,
      });
    } catch (error) {
      console.error("Get search history error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get search history",
      });
    }
  };
}

// Clear search history
function clearSearchHistory(state) {
  return (req, res) => {
    try {
      state.searchHistory = [];
      state.lastSearchTime = null;

      res.json({
        success: true,
        message: "Search history cleared",
      });
    } catch (error) {
      console.error("Clear search history error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear search history",
      });
    }
  };
}

// Get search statistics
function getSearchStats(state) {
  return {
    totalSearches: state.searchHistory.length,
    lastSearchTime: state.lastSearchTime,
    recentSearches: state.searchHistory.slice(-5).reverse(),
  };
}

// Create a functional song controller
function createSongController() {
  const state = createSongControllerState();

  return {
    // State access
    state,

    // Search endpoints
    searchSongs: searchSongs(state),
    searchMultipleSongs: searchMultipleSongs(state),
    getSongInfo: getSongInfo(state),
    validateUrl: validateUrl(state),

    // History endpoints
    getSearchHistory: getSearchHistory(state),
    clearSearchHistory: clearSearchHistory(state),

    // Utility functions
    getSearchStats: () => getSearchStats(state),
  };
}

module.exports = {
  createSongController,
  // Export individual functions for testing or advanced usage
  createSongControllerState,
  searchSongs,
  searchMultipleSongs,
  getSongInfo,
  validateUrl,
  getSearchHistory,
  clearSearchHistory,
  getSearchStats,
};
