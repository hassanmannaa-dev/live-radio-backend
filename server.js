const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const { exec, spawn } = require("child_process");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for development
  })
); // Security headers without CSP restrictions
app.use(cors()); // Enable CORS
app.use(morgan("combined")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(".")); // Serve static files from current directory

// Radio Station State
let radioState = {
  currentSong: null,
  isPlaying: false,
  startTime: null,
  currentTime: 0,
  playlist: [],
  listeners: new Set(),
};

let currentStream = null; // The active yt-dlp process

function searchSong(songTitle) {
  console.log(
    `Searching for song: ${songTitle} using url: https://music.youtube.com/search?q=${songTitle}`
  );
  return new Promise((resolve, reject) => {
    const command = `yt-dlp -j "https://music.youtube.com/search?q=${songTitle}" --playlist-items 1`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      try {
        // -j outputs JSON metadata for the first result
        const info = JSON.parse(stdout);
        resolve(info);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Add song to radio queue (only DJ/admin can do this)
app.post("/queue", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Song ID is required" });
  }

  try {
    // Get song info first
    const songInfo = await getSongInfo(id);
    radioState.playlist.push(songInfo);

    // If nothing is playing, start this song
    if (!radioState.isPlaying) {
      playNextSong();
    }

    // Notify all clients about playlist update
    io.emit("playlistUpdate", radioState.playlist);

    res.json({
      message: "Song added to queue",
      song: songInfo,
      position: radioState.playlist.length,
    });
  } catch (error) {
    console.error("Queue error:", error);
    res.status(500).json({ error: "Failed to add song to queue" });
  }
});

// Get current radio state
app.get("/radio/status", (req, res) => {
  const currentPosition =
    radioState.isPlaying && radioState.startTime
      ? Date.now() - radioState.startTime
      : 0;

  res.json({
    currentSong: radioState.currentSong,
    isPlaying: radioState.isPlaying,
    currentPosition: currentPosition,
    playlist: radioState.playlist,
    listeners: radioState.listeners.size,
  });
});

// Stream the current radio audio
app.get("/radio/stream", (req, res) => {
  console.log("New listener joined the radio stream");

  // Set headers for audio streaming
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Accept-Ranges", "none");

  // Add this connection to listeners
  const listenerId = Date.now() + Math.random();
  radioState.listeners.add(listenerId);

  // If there's an active stream, pipe it to this response
  if (currentStream && currentStream.stdout) {
    currentStream.stdout.pipe(res, { end: false });
  } else {
    // No active stream, send silence or wait
    res.write(""); // Keep connection alive
  }

  // Clean up when client disconnects
  res.on("close", () => {
    console.log("Listener disconnected from radio stream");
    radioState.listeners.delete(listenerId);
    io.emit("listenerUpdate", radioState.listeners.size);
  });

  // Update listener count
  io.emit("listenerUpdate", radioState.listeners.size);
});

// Get song info without playing
async function getSongInfo(id) {
  return new Promise((resolve, reject) => {
    const url = `https://music.youtube.com/watch?v=${id}`;
    const command = `yt-dlp -j "${url}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      try {
        const info = JSON.parse(stdout);
        resolve({
          id: info.id,
          title: info.title,
          artist: info.artist || info.uploader,
          duration: info.duration,
          thumbnail: info.thumbnail,
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Play the next song in queue for all listeners
function playNextSong() {
  if (radioState.playlist.length === 0) {
    radioState.isPlaying = false;
    radioState.currentSong = null;
    io.emit("radioUpdate", radioState);
    return;
  }

  const nextSong = radioState.playlist.shift();
  radioState.currentSong = nextSong;
  radioState.isPlaying = true;
  radioState.startTime = Date.now();

  console.log(`🎵 Now playing: ${nextSong.title}`);

  // Kill previous stream if exists
  if (currentStream) {
    currentStream.kill("SIGKILL");
  }

  // Start new yt-dlp stream
  const url = `https://music.youtube.com/watch?v=${nextSong.id}`;
  currentStream = spawn("yt-dlp", [
    "-f",
    "bestaudio/best",
    "--no-playlist",
    "-o",
    "-",
    url,
  ]);

  // Broadcast to all connected listeners
  currentStream.stdout.on("data", (chunk) => {
    // This data goes to all connected /radio/stream clients automatically
  });

  currentStream.on("close", (code) => {
    console.log(`Song ended: ${nextSong.title}`);

    // Song finished, play next one
    setTimeout(() => {
      playNextSong();
    }, 1000); // Small gap between songs
  });

  currentStream.on("error", (error) => {
    console.error("Stream error:", error);
    // Try next song on error
    setTimeout(() => {
      playNextSong();
    }, 2000);
  });

  // Notify all clients about current song
  io.emit("radioUpdate", {
    currentSong: radioState.currentSong,
    isPlaying: radioState.isPlaying,
    startTime: radioState.startTime,
    playlist: radioState.playlist,
  });
}

// Search for Song
app.get("/search", async (req, res) => {
  const { query } = req.query;

  const data = await searchSong(query);
  const song = {
    title: data.title,
    artist: data.artist,
    album: data.album,
    duration: data.duration,
    thumbnail: data.thumbnail,
    url: data.original_url,
    id: data.id,
    playlist: data.playlist,
  };
  res.send(song);
});

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Live Radio Backend API",
    version: "1.0.0",
    status: "running",
  });
});

// Handle favicon.ico requests
app.get("/favicon.ico", (req, res) => {
  res.status(204).end(); // No content
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API Routes placeholder
app.use("/api", (req, res) => {
  res.json({
    message: "API endpoint not implemented yet",
    endpoint: req.originalUrl,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Send current radio state to new user
  socket.emit("radioUpdate", {
    currentSong: radioState.currentSong,
    isPlaying: radioState.isPlaying,
    startTime: radioState.startTime,
    playlist: radioState.playlist,
  });

  socket.emit("listenerUpdate", radioState.listeners.size);

  socket.on("disconnect", () => {
    console.log(`👤 User disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Radio Server running on port ${PORT}`);
  console.log(`📡 Live Radio Station ready`);
  console.log(`🎵 WebSocket enabled for real-time sync`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
