const UserService = require("../services/UserService");
const Chat = require("../models/Chat");

// State management functions
function createUserControllerState(io) {
  return {
    io,
    socketToUser: new Map(), // Map socket IDs to user IDs
    chat: Chat.createChat(), // Chat instance for message persistence
  };
}

// Register a new user
function registerUser(state) {
  return async (req, res) => {
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
      const existingUser = UserService.getAllUsers().find(
        (user) => user.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (existingUser && existingUser.isOnline) {
        return res.status(409).json({
          success: false,
          error: "A user with this name is already online",
        });
      }

      // Create new user with generated ID
      const userData = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        avatarId: avatarId,
      };

      const user = UserService.createUser(userData);

      console.log(`👤 User registered: ${user.name} (ID: ${user.id})`);

      // Broadcast new user joined (without socket connection yet)
      state.io.emit("userJoined", {
        id: user.id,
        name: user.name,
        avatarId: user.avatarId,
        isOnline: user.isOnline,
        joinedAt: user.joinedAt,
      });
      state.io.emit("usersUpdate", getOnlineUsers(state));

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          avatarId: user.avatarId,
          isOnline: user.isOnline,
          joinedAt: user.joinedAt,
          lastActivity: user.lastActivity,
        },
        message: "User registered successfully",
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  };
}

// Connect a registered user via socket
function connectUser(state, userId, socketId) {
  const user = UserService.getUserById(userId);
  if (user) {
    UserService.updateSocketId(userId, socketId);
    UserService.setUserOnlineStatus(userId, true);
    state.socketToUser.set(socketId, userId);

    console.log(`🔌 User connected: ${user.name} (Socket: ${socketId})`);

    // Get updated user data
    const updatedUser = UserService.getUserById(userId);

    // Broadcast user came online
    state.io.emit("userOnline", {
      id: updatedUser.id,
      name: updatedUser.name,
      avatarId: updatedUser.avatarId,
      isOnline: updatedUser.isOnline,
      joinedAt: updatedUser.joinedAt,
    });
    state.io.emit("usersUpdate", getOnlineUsers(state));

    return updatedUser;
  }
  return null;
}

// Disconnect a user
function disconnectUser(state, socketId) {
  const userId = state.socketToUser.get(socketId);
  if (userId) {
    const user = UserService.getUserById(userId);
    if (user) {
      UserService.setUserOnlineStatus(userId, false);
      state.socketToUser.delete(socketId);

      console.log(`🔌 User disconnected: ${user.name} (Socket: ${socketId})`);

      // Get updated user data
      const updatedUser = UserService.getUserById(userId);

      // Broadcast user went offline
      state.io.emit("userOffline", {
        id: updatedUser.id,
        name: updatedUser.name,
        avatarId: updatedUser.avatarId,
        isOnline: updatedUser.isOnline,
        joinedAt: updatedUser.joinedAt,
      });
      state.io.emit("usersUpdate", getOnlineUsers(state));

      return updatedUser;
    }
  }
  return null;
}

// Get user by socket ID
function getUserBySocketId(state, socketId) {
  const userId = state.socketToUser.get(socketId);
  return userId ? UserService.getUserById(userId) : null;
}

// Get user by ID
function getUserById(state, userId) {
  return UserService.getUserById(userId);
}

// Get all online users
function getOnlineUsers(state) {
  return UserService.getOnlineUsers().map((user) => ({
    id: user.id,
    name: user.name,
    avatarId: user.avatarId,
    isOnline: user.isOnline,
    joinedAt: user.joinedAt,
  }));
}

// Get all users (including offline)
function getAllUsers(state) {
  return UserService.getAllUsers().map((user) => ({
    id: user.id,
    name: user.name,
    avatarId: user.avatarId,
    isOnline: user.isOnline,
    joinedAt: user.joinedAt,
    lastActivity: user.lastActivity,
  }));
}

// API endpoint to get online users
function getOnlineUsersEndpoint(state) {
  return async (req, res) => {
    try {
      const onlineUsers = getOnlineUsers(state);
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
}

// API endpoint to get user info
function getUserInfoEndpoint(state) {
  return async (req, res) => {
    try {
      const { userId } = req.params;
      const user = getUserById(state, userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          avatarId: user.avatarId,
          isOnline: user.isOnline,
          joinedAt: user.joinedAt,
          lastActivity: user.lastActivity,
        },
      });
    } catch (error) {
      console.error("Error getting user info:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };
}

// Update user activity (called when user performs actions)
function updateUserActivity(state, socketId) {
  const userId = state.socketToUser.get(socketId);
  if (userId) {
    UserService.updateLastActivity(userId);
  }
}

// Cleanup inactive users (optional - could be called periodically)
function cleanupInactiveUsers(state, maxInactiveHours = 24) {
  const inactiveThresholdMs = maxInactiveHours * 60 * 60 * 1000;
  const removedUserIds = UserService.removeInactiveUsers(inactiveThresholdMs);

  if (removedUserIds.length > 0) {
    console.log(`🧹 Cleaned up ${removedUserIds.length} inactive users`);
  }

  return removedUserIds.length;
}

// Get user stats
function getUserStats(state) {
  const stats = UserService.getStatistics();

  return {
    total: stats.totalUsers,
    online: stats.onlineUsers,
    offline: stats.offlineUsers,
  };
}

// Add message to chat history
function addChatMessage(state, messageData) {
  return Chat.addMessage(state.chat, messageData);
}

// Get chat history
function getChatHistory(state, count = 50) {
  return Chat.getRecentMessages(state.chat, count);
}

// API endpoint to get chat history
function getChatHistoryEndpoint(state) {
  return async (req, res) => {
    try {
      const count = parseInt(req.query.count) || 50;
      const messages = getChatHistory(state, count);

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

// Create a functional user controller
function createUserController(io) {
  const state = createUserControllerState(io);

  return {
    // State access
    state,

    // Core user management
    registerUser: registerUser(state),
    connectUser: (userId, socketId) => connectUser(state, userId, socketId),
    disconnectUser: (socketId) => disconnectUser(state, socketId),

    // User queries
    getUserBySocketId: (socketId) => getUserBySocketId(state, socketId),
    getUserById: (userId) => getUserById(state, userId),
    getOnlineUsers: () => getOnlineUsers(state),
    getAllUsers: () => getAllUsers(state),

    // API endpoints
    getOnlineUsersEndpoint: getOnlineUsersEndpoint(state),
    getUserInfo: getUserInfoEndpoint(state),
    getChatHistoryEndpoint: getChatHistoryEndpoint(state),

    // Utility functions
    updateUserActivity: (socketId) => updateUserActivity(state, socketId),
    cleanupInactiveUsers: (maxInactiveHours) =>
      cleanupInactiveUsers(state, maxInactiveHours),
    getUserStats: () => getUserStats(state),

    // Chat functions
    addChatMessage: (messageData) => addChatMessage(state, messageData),
    getChatHistory: (count) => getChatHistory(state, count),
  };
}

module.exports = {
  createUserController,
  // Export individual functions for testing or advanced usage
  createUserControllerState,
  registerUser,
  connectUser,
  disconnectUser,
  getUserBySocketId,
  getUserById,
  getOnlineUsers,
  getAllUsers,
  getOnlineUsersEndpoint,
  getUserInfoEndpoint,
  updateUserActivity,
  cleanupInactiveUsers,
  getUserStats,
  addChatMessage,
  getChatHistory,
  getChatHistoryEndpoint,
};
