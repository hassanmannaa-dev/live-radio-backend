const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Song = require('../models/Song');

// Path to cookies file (in project root)
const COOKIES_PATH = path.join(__dirname, '../../cookies.txt');

class YouTubeService {
  static initCookies() {
    // If cookies file doesn't exist but env var does, create it
    if (!fs.existsSync(COOKIES_PATH)) {
      try {
        let cookiesContent = null;

        // Try base64 encoded version first
        if (process.env.YOUTUBE_COOKIES_B64) {
          cookiesContent = Buffer.from(process.env.YOUTUBE_COOKIES_B64, 'base64').toString('utf8');
          console.log('Decoded cookies from YOUTUBE_COOKIES_B64');
        } else if (process.env.YOUTUBE_COOKIES) {
          cookiesContent = process.env.YOUTUBE_COOKIES;
          console.log('Using cookies from YOUTUBE_COOKIES');
        }

        if (cookiesContent) {
          fs.writeFileSync(COOKIES_PATH, cookiesContent);
          console.log('Created cookies.txt from environment variable');
        }
      } catch (err) {
        console.error('Failed to write cookies file:', err.message);
      }
    }
  }

  static getCookiesArgs() {
    YouTubeService.initCookies();
    if (fs.existsSync(COOKIES_PATH)) {
      return ['--cookies', COOKIES_PATH];
    }
    return [];
  }

  static async searchSong(query) {
    return new Promise((resolve, reject) => {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://music.youtube.com/search?q=${encodedQuery}`;

      const args = [
        '-j',
        '--flat-playlist',
        '--playlist-items', '1',
        '--no-warnings',
        ...YouTubeService.getCookiesArgs(),
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
          console.error('yt-dlp search failed with code:', code);
          console.error('yt-dlp stderr:', stderr);
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
        '--skip-download',
        ...YouTubeService.getCookiesArgs(),
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
          console.error('yt-dlp getSongInfo failed with code:', code);
          console.error('yt-dlp stderr:', stderr);
          resolve(null);
          return;
        }

        try {
          const data = JSON.parse(stdout.trim());
          const song = Song.fromYouTubeData(data);
          resolve(song);
        } catch (error) {
          console.error('Failed to parse song info:', error.message);
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
