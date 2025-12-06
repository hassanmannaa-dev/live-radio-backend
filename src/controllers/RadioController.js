const { v4: uuidv4 } = require('uuid');

class RadioController {
  constructor(radioService, streamingService, io) {
    this.radioService = radioService;
    this.streamingService = streamingService;
    this.io = io;
  }

  getStatus = async (req, res, next) => {
    try {
      const status = this.radioService.getStatus();
      res.json(status);
    } catch (error) {
      next(error);
    }
  };

  stream = async (req, res, next) => {
    try {
      console.log('Stream requested, isPlaying:', this.radioService.isPlaying());
      if (!this.radioService.isPlaying()) {
        return res.status(404).json({
          success: false,
          error: 'No song is currently playing'
        });
      }

      res.set({
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      });

      const listenerId = uuidv4();
      this.radioService.addListener(listenerId);

      this.io.emit('listenerUpdate', { count: this.radioService.getListenerCount() });

      const success = this.streamingService.pipeToResponse(res);

      if (!success) {
        this.radioService.removeListener(listenerId);
        return res.status(503).json({
          success: false,
          error: 'Stream not available'
        });
      }

      req.on('close', () => {
        this.radioService.removeListener(listenerId);
        this.io.emit('listenerUpdate', { count: this.radioService.getListenerCount() });
      });
    } catch (error) {
      next(error);
    }
  };

  stop = async (req, res, next) => {
    try {
      this.radioService.stop();

      this.io.emit('radioUpdate', this.radioService.getStatus());

      res.json({
        success: true,
        message: 'Playback stopped'
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = RadioController;
