const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Song = require('../models/Song');

// Path to cookies file (in project root)
const COOKIES_PATH = path.join(__dirname, '../../cookies.txt');

// Cache for song data (to avoid blocked video fetch on cloud servers)
const songCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

class YouTubeService {
  static cacheSong(song) {
    songCache.set(song.id, {
      song,
      timestamp: Date.now()
    });
  }

  static getCachedSong(videoId) {
    const cached = songCache.get(videoId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.song;
    }
    songCache.delete(videoId);
    return null;
  }

  static initCookies() {
    // If cookies file doesn't exist but env var does, create it
    if (!fs.existsSync(COOKIES_PATH) && process.env.YOUTUBE_COOKIES) {
      try {
        fs.writeFileSync(COOKIES_PATH, process.env.YOUTUBE_COOKIES);
        console.log('Created cookies.txt from environment variable');
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
      // Add filter for songs only (sp=EgWKAQIIAQ%3D%3D)
      const searchUrl = `https://music.youtube.com/search?q=${encodedQuery}&sp=EgWKAQIIAQ%3D%3D`;

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
          console.error('yt-dlp search failed:', stderr);
          resolve(null);
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          if (result.id) {
            // Create song from flat-playlist data (video fetch is blocked on cloud servers)
            const song = Song.fromYouTubeData({
              id: result.id,
              title: result.title || 'Unknown Title',
              artist: result.uploader || result.channel || 'Unknown Artist',
              album: result.album || null,
              duration: result.duration || 0,
              thumbnail: `https://i.ytimg.com/vi/${result.id}/hqdefault.jpg`,
              url: result.url || result.webpage_url || `https://music.youtube.com/watch?v=${result.id}`
            });
            // Cache the song for later retrieval by ID
            YouTubeService.cacheSong(song);
            resolve(song);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Failed to parse yt-dlp output:', error.message);
          resolve(null);
        }
      });

      ytdlp.on('error', (err) => {
        console.error('yt-dlp spawn error:', err.message);
        resolve(null);
      });
    });
  }

  static async getSongInfo(videoId) {
    // Check cache first (populated by searchSong)
    const cached = YouTubeService.getCachedSong(videoId);
    if (cached) {
      console.log('Song retrieved from cache:', videoId);
      return cached;
    }

    return new Promise((resolve, reject) => {
      // Fallback: search for the video ID
      const searchUrl = `https://music.youtube.com/search?q=${videoId}&sp=EgWKAQIIAQ%3D%3D`;

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

      ytdlp.on('close', (code) => {
        if (code !== 0 || !stdout.trim()) {
          console.error('yt-dlp getSongInfo failed:', stderr);
          resolve(null);
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          if (result.id) {
            const song = Song.fromYouTubeData({
              id: result.id,
              title: result.title || 'Unknown Title',
              artist: result.uploader || result.channel || 'Unknown Artist',
              album: result.album || null,
              duration: result.duration || 0,
              thumbnail: `https://i.ytimg.com/vi/${result.id}/hqdefault.jpg`,
              url: result.url || result.webpage_url || `https://music.youtube.com/watch?v=${result.id}`
            });
            resolve(song);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Failed to parse getSongInfo output:', error.message);
          resolve(null);
        }
      });

      ytdlp.on('error', (err) => {
        console.error('yt-dlp getSongInfo spawn error:', err.message);
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
