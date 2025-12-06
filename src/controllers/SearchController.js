const YouTubeService = require('../services/YouTubeService');

class SearchController {
  search = async (req, res, next) => {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Query must be at least 2 characters'
        });
      }

      const song = await YouTubeService.searchSong(query.trim());

      if (!song) {
        return res.status(404).json({
          success: false,
          error: 'No results found'
        });
      }

      res.json({
        success: true,
        song: song.getInfo()
      });
    } catch (error) {
      next(error);
    }
  };

  getSongById = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      const song = await YouTubeService.getSongInfo(id);

      if (!song) {
        return res.status(404).json({
          success: false,
          error: 'Song not found'
        });
      }

      res.json({
        success: true,
        song: song.getInfo()
      });
    } catch (error) {
      next(error);
    }
  };

  validateUrl = async (req, res, next) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'URL is required'
        });
      }

      const isValid = YouTubeService.isValidUrl(url);
      const videoId = YouTubeService.extractVideoId(url);

      res.json({
        isValid,
        videoId,
        url
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = SearchController;
