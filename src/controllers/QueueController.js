const Song = require('../models/Song');

class QueueController {
  constructor(queueService, radioService, io) {
    this.queueService = queueService;
    this.radioService = radioService;
    this.io = io;
  }

  addSong = async (req, res, next) => {
    try {
      const { id, title, artist, album, duration, thumbnail, url } = req.body;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'YouTube video ID is required'
        });
      }

      // Accept full song data from frontend (since getSongInfo is blocked on cloud servers)
      const song = new Song({
        id,
        title: title || 'Unknown Title',
        artist: artist || 'Unknown Artist',
        album: album || null,
        duration: duration || 0,
        thumbnail: thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        url: url || `https://music.youtube.com/watch?v=${id}`
      });

      if (!song.id || !song.title) {
        return res.status(400).json({
          success: false,
          error: 'Song ID and title are required'
        });
      }

      this.queueService.addSong(song);

      const wasPlaying = this.radioService.isPlaying();

      if (!wasPlaying) {
        await this.radioService.playNext();
        this.io.emit('radioUpdate', this.radioService.getStatus());
      }

      this.io.emit('playlistUpdate', { playlist: this.queueService.getPlaylist() });

      res.status(201).json({
        success: true,
        song: song.getInfo(),
        playlist: this.queueService.getPlaylist()
      });
    } catch (error) {
      next(error);
    }
  };

  getPlaylist = async (req, res, next) => {
    try {
      const currentSong = this.radioService.getCurrentSong();

      res.json({
        currentSong: currentSong ? currentSong.getInfo() : null,
        playlist: this.queueService.getPlaylist()
      });
    } catch (error) {
      next(error);
    }
  };

  removeSong = async (req, res, next) => {
    try {
      const index = parseInt(req.params.index);

      if (isNaN(index) || index < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid index'
        });
      }

      const removed = this.queueService.removeSong(index);

      if (!removed) {
        return res.status(404).json({
          success: false,
          error: 'Song not found at index'
        });
      }

      this.io.emit('playlistUpdate', { playlist: this.queueService.getPlaylist() });

      res.json({
        success: true,
        removed: removed.getInfo(),
        playlist: this.queueService.getPlaylist()
      });
    } catch (error) {
      next(error);
    }
  };

  clearPlaylist = async (req, res, next) => {
    try {
      this.queueService.clearPlaylist();

      this.io.emit('playlistUpdate', { playlist: this.queueService.getPlaylist() });

      res.json({
        success: true,
        message: 'Playlist cleared'
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = QueueController;
