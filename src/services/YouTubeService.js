const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Song = require('../models/Song');

const COOKIES_PATH = path.join(__dirname, '../../cookies.txt');

// Only modify PATH on Heroku (detected by DYNO env var)
const YTDLP_ENV = process.env.DYNO
  ? { ...process.env, PATH: `/app/.heroku/node/bin:${process.env.PATH || ''}` }
  : process.env;

function initCookies() {
  console.log('[YouTubeService] initCookies called');
  console.log('[YouTubeService] COOKIES_PATH:', COOKIES_PATH);
  console.log('[YouTubeService] cookies.txt exists:', fs.existsSync(COOKIES_PATH));
  console.log('[YouTubeService] YOUTUBE_COOKIES_B64 set:', !!process.env.YOUTUBE_COOKIES_B64);

  if (!fs.existsSync(COOKIES_PATH) && process.env.YOUTUBE_COOKIES_B64) {
    try {
      const content = Buffer.from(process.env.YOUTUBE_COOKIES_B64, 'base64').toString('utf8');
      fs.writeFileSync(COOKIES_PATH, content);
      console.log('[YouTubeService] Created cookies.txt from YOUTUBE_COOKIES_B64');
      console.log('[YouTubeService] Cookie file size:', content.length, 'bytes');
    } catch (err) {
      console.error('[YouTubeService] Failed to write cookies:', err.message);
    }
  }
}

function getCookiesArgs() {
  initCookies();
  const args = fs.existsSync(COOKIES_PATH) ? ['--cookies', COOKIES_PATH] : [];
  console.log('[YouTubeService] getCookiesArgs:', args);
  return args;
}

class YouTubeService {
  static async searchSong(query) {
    console.log('[YouTubeService] searchSong called with query:', query);
    return new Promise((resolve, reject) => {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://music.youtube.com/search?q=${encodedQuery}`;

      const cookiesArgs = getCookiesArgs();
      const args = [
        '-j',
        '--flat-playlist',
        '--playlist-items', '1',
        '--no-warnings',
        ...cookiesArgs,
        searchUrl
      ];

      console.log('[YouTubeService] searchSong spawning yt-dlp with args:', args.join(' '));
      console.log('[YouTubeService] PATH in env:', YTDLP_ENV.PATH?.substring(0, 100) + '...');

      const ytdlp = spawn('yt-dlp', args, { env: YTDLP_ENV });
      let stdout = '';
      let stderr = '';

      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ytdlp.on('close', async (code) => {
        console.log('[YouTubeService] searchSong yt-dlp closed with code:', code);
        console.log('[YouTubeService] searchSong stdout length:', stdout.length);
        console.log('[YouTubeService] searchSong stderr:', stderr || '(empty)');

        if (code !== 0 || !stdout.trim()) {
          console.log('[YouTubeService] searchSong failed - code:', code, 'stdout empty:', !stdout.trim());
          resolve(null);
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          console.log('[YouTubeService] searchSong parsed result, id:', result.id);
          if (result.id) {
            console.log('[YouTubeService] searchSong calling getSongInfo for id:', result.id);
            const songInfo = await YouTubeService.getSongInfo(result.id);
            console.log('[YouTubeService] searchSong getSongInfo returned:', songInfo ? 'song object' : 'null');
            resolve(songInfo);
          } else {
            console.log('[YouTubeService] searchSong no id in result');
            resolve(null);
          }
        } catch (error) {
          console.error('[YouTubeService] searchSong parse error:', error.message);
          resolve(null);
        }
      });

      ytdlp.on('error', (error) => {
        console.error('[YouTubeService] searchSong spawn error:', error.message);
        resolve(null);
      });
    });
  }

  static async getSongInfo(videoId) {
    console.log('[YouTubeService] getSongInfo called with videoId:', videoId);
    return new Promise((resolve, reject) => {
      const url = `https://music.youtube.com/watch?v=${videoId}`;

      // Note: cookies NOT used here - they cause "format not available" errors
      const args = [
        '-j',
        '--no-playlist',
        '--no-warnings',
        url
      ];

      console.log('[YouTubeService] getSongInfo spawning yt-dlp with args:', args.join(' '));

      const ytdlp = spawn('yt-dlp', args, { env: YTDLP_ENV });
      let stdout = '';
      let stderr = '';

      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ytdlp.on('close', (code) => {
        console.log('[YouTubeService] getSongInfo yt-dlp closed with code:', code);
        console.log('[YouTubeService] getSongInfo stdout length:', stdout.length);
        console.log('[YouTubeService] getSongInfo stderr:', stderr || '(empty)');

        if (code !== 0 || !stdout.trim()) {
          console.log('[YouTubeService] getSongInfo failed - code:', code, 'stdout empty:', !stdout.trim());
          resolve(null);
          return;
        }

        try {
          const data = JSON.parse(stdout.trim());
          console.log('[YouTubeService] getSongInfo parsed data, title:', data.title);
          const song = Song.fromYouTubeData(data);
          console.log('[YouTubeService] getSongInfo created song:', song.title, 'by', song.artist);
          resolve(song);
        } catch (error) {
          console.error('[YouTubeService] getSongInfo parse error:', error.message);
          resolve(null);
        }
      });

      ytdlp.on('error', (error) => {
        console.error('[YouTubeService] getSongInfo spawn error:', error.message);
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
