const { spawn } = require('child_process');
const Song = require('../models/Song');

class YouTubeService {
  static async searchSong(query) {
    return new Promise((resolve, reject) => {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://music.youtube.com/search?q=${encodedQuery}`;

      const args = [
        '-j',
        '--flat-playlist',
        '--playlist-items', '1',
        '--no-warnings',
        searchUrl
      ];

      const ytdlp = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ytdlp.on('close', async (code) => {
        if (code !== 0 || !stdout.trim()) {
          resolve(null);
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          if (result.id) {
            const songInfo = await YouTubeService.getSongInfo(result.id);
            resolve(songInfo);
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      });

      ytdlp.on('error', () => {
        resolve(null);
      });
    });
  }

  static async getSongInfo(videoId) {
    return new Promise((resolve, reject) => {
      const url = `https://music.youtube.com/watch?v=${videoId}`;

      const args = [
        '-j',
        '--no-playlist',
        '--no-warnings',
        url
      ];

      const ytdlp = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ytdlp.on('close', (code) => {
        if (code !== 0 || !stdout.trim()) {
          resolve(null);
          return;
        }

        try {
          const data = JSON.parse(stdout.trim());
          const song = Song.fromYouTubeData(data);
          resolve(song);
        } catch (error) {
          resolve(null);
        }
      });

      ytdlp.on('error', () => {
        resolve(null);
      });
    });
  }

  static isValidUrl(url) {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/music\.youtube\.com\/watch\?v=[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  }

  static extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([\w-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }
}

module.exports = YouTubeService;
