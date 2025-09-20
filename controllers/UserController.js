const User = require("../models/User");
const Chat = require("../models/Chat");

class UserController {
  constructor(io) {
    this.io = io;
    this.users = new Map(); // Store users by ID
    this.socketToUser = new Map(); // Map socket IDs to user IDs
    this.chat = new Chat(); // Chat instance for message persistence
  }

  // Register a new user
  registerUser = async (req, res) => {
    try {
      const { name, avatarId } = req.body;

      // Validate input
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: "Name is required",
        });
      }

      if (!avatarId || typeof avatarId !== "number") {
        return res.status(400).json({
          success: false,
          error: "Valid avatar ID is required",
        });
      }

      // Check for duplicate names (optional - you might want to allow duplicates)
      const existingUser = Array.from(this.users.values()).find(
        (user) => user.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (existingUser && existingUser.isOnline) {
        return res.status(409).json({
          success: false,
          error: "A user with this name is already online",
        });
      }

      // Create new user
      const userData = {
        name: name.trim(),
        avatarId: avatarId,
      };

      const user = new User(userData);

      // Validate user data
      if (!user.isValid()) {
        return res.status(400).json({
          success: false,
          error: "Invalid user data",
        });
      }

      // Store user
      this.users.set(user.id, user);

      console.log(`👤 User registered: ${user.name} (ID: ${user.id})`);

      // Broadcast new user joined (without socket connection yet)
      this.io.emit("userJoined", user.getPublicInfo());
      this.io.emit("usersUpdate", this.getOnlineUsers());

      res.json({
        success: true,
        user: user.getInfo(),
        message: "User registered successfully",
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };

  // Connect a registered user via socket
  connectUser(userId, socketId) {
    const user = this.users.get(userId);
    if (user) {
      user.updateSocketId(socketId);
      this.socketToUser.set(socketId, userId);

      console.log(`🔌 User connected: ${user.name} (Socket: ${socketId})`);

      // Broadcast user came online
      this.io.emit("userOnline", user.getPublicInfo());
      this.io.emit("usersUpdate", this.getOnlineUsers());

      return user;
    }
    return null;
  }

  // Disconnect a user
  disconnectUser(socketId) {
    const userId = this.socketToUser.get(socketId);
    if (userId) {
      const user = this.users.get(userId);
      if (user) {
        user.setOffline();
        this.socketToUser.delete(socketId);

        console.log(`🔌 User disconnected: ${user.name} (Socket: ${socketId})`);

        // Broadcast user went offline
        this.io.emit("userOffline", user.getPublicInfo());
        this.io.emit("usersUpdate", this.getOnlineUsers());

        return user;
      }
    }
    return null;
  }

  // Get user by socket ID
  getUserBySocketId(socketId) {
    const userId = this.socketToUser.get(socketId);
    return userId ? this.users.get(userId) : null;
  }

  // Get user by ID
  getUserById(userId) {
    return this.users.get(userId);
  }

  // Get all online users
  getOnlineUsers() {
    return Array.from(this.users.values())
      .filter((user) => user.isOnline)
      .map((user) => user.getPublicInfo());
  }

  // Get all users (including offline)
  getAllUsers() {
    return Array.from(this.users.values()).map((user) => user.getInfo());
  }

  // API endpoint to get online users
  getOnlineUsersEndpoint = async (req, res) => {
    try {
      const onlineUsers = this.getOnlineUsers();
      res.json({
        success: true,
        users: onlineUsers,
        count: onlineUsers.length,
      });
    } catch (error) {
      console.error("Error getting online users:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };

  // API endpoint to get user info
  getUserInfo = async (req, res) => {
    try {
      const { userId } = req.params;
      const user = this.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        user: user.getInfo(),
      });
    } catch (error) {
      console.error("Error getting user info:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };

  // Update user activity (called when user performs actions)
  updateUserActivity(socketId) {
    const user = this.getUserBySocketId(socketId);
    if (user) {
      user.updateActivity();
    }
  }

  // Cleanup inactive users (optional - could be called periodically)
  cleanupInactiveUsers(maxInactiveHours = 24) {
    const cutoffTime = new Date(Date.now() - maxInactiveHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [userId, user] of this.users.entries()) {
      if (!user.isOnline && user.lastActivity < cutoffTime) {
        this.users.delete(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} inactive users`);
    }

    return cleanedCount;
  }

  // Get user stats
  getUserStats() {
    const totalUsers = this.users.size;
    const onlineUsers = this.getOnlineUsers().length;
    const offlineUsers = totalUsers - onlineUsers;

    return {
      total: totalUsers,
      online: onlineUsers,
      offline: offlineUsers,
    };
  }

  // Add message to chat history
  addChatMessage(messageData) {
    return this.chat.addMessage(messageData);
  }

  // Get chat history
  getChatHistory(count = 50) {
    return this.chat.getRecentMessages(count);
  }

  // API endpoint to get chat history
  getChatHistoryEndpoint = async (req, res) => {
    try {
      const count = parseInt(req.query.count) || 50;
      const messages = this.getChatHistory(count);

      res.json({
        success: true,
        messages: messages,
        count: messages.length,
      });
    } catch (error) {
      console.error("Error getting chat history:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };
}

module.exports = UserController;
