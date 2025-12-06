const UserModel = require("../models/User");

// In-memory user storage
let users = new Map();

// Validation function
function validateUserData(userData) {
  if (!userData.id || typeof userData.id !== "string") {
    throw new Error("User ID is required and must be a string");
  }
  if (!userData.name || typeof userData.name !== "string") {
    throw new Error("User name is required and must be a string");
  }
  if (userData.name.trim().length === 0) {
    throw new Error("User name cannot be empty");
  }
  if (userData.name.length > 50) {
    throw new Error("User name cannot exceed 50 characters");
  }
}

// Create user
function createUser(userData) {
  validateUserData(userData);

  const user = {
    ...UserModel,
    id: userData.id,
    name: userData.name,
    avatarId: userData.avatarId || null,
    socketId: userData.socketId,
    joinedAt: new Date(),
    isOnline: true,
    lastActivity: new Date(),
  };

  users.set(user.id, user);
  return user;
}

// Get user by ID
function getUserById(userId) {
  return users.get(userId) || null;
}

// Get user by socket ID
function getUserBySocketId(socketId) {
  for (const user of users.values()) {
    if (user.socketId === socketId) {
      return user;
    }
  }
  return null;
}

// Get all users
function getAllUsers() {
  return Array.from(users.values());
}

// Get online users
function getOnlineUsers() {
  return getAllUsers().filter((user) => user.isOnline);
}

// Update user
function updateUser(userId, updateData) {
  const user = users.get(userId);
  if (!user) {
    return null;
  }

  const updatedUser = {
    ...user,
    ...updateData,
    lastActivity: new Date(),
  };

  users.set(userId, updatedUser);
  return updatedUser;
}

// Delete user
function deleteUser(userId) {
  return users.delete(userId);
}

// Set user online status
function setUserOnlineStatus(userId, isOnline) {
  return updateUser(userId, { isOnline });
}

// Update socket ID
function updateSocketId(userId, socketId) {
  return updateUser(userId, { socketId });
}

// Update last activity
function updateLastActivity(userId) {
  return updateUser(userId, { lastActivity: new Date() });
}

// Check if user exists
function userExists(userId) {
  return users.has(userId);
}

// Get user count
function getUserCount() {
  return users.size;
}

// Get online user count
function getOnlineUserCount() {
  return getOnlineUsers().length;
}

// Clear all users
function clearAllUsers() {
  users.clear();
}

// Remove inactive users
function removeInactiveUsers(inactiveThresholdMs = 60 * 60 * 1000) {
  const now = new Date();
  const removedUserIds = [];

  for (const [userId, user] of users.entries()) {
    const timeSinceLastActivity = now - new Date(user.lastActivity);
    if (timeSinceLastActivity > inactiveThresholdMs) {
      users.delete(userId);
      removedUserIds.push(userId);
    }
  }

  return removedUserIds;
}

// Get statistics
function getStatistics() {
  const allUsers = getAllUsers();
  const onlineUsers = getOnlineUsers();

  return {
    totalUsers: allUsers.length,
    onlineUsers: onlineUsers.length,
    offlineUsers: allUsers.length - onlineUsers.length,
  };
}

module.exports = {
  createUser,
  getUserById,
  getUserBySocketId,
  getAllUsers,
  getOnlineUsers,
  updateUser,
  deleteUser,
  setUserOnlineStatus,
  updateSocketId,
  updateLastActivity,
  userExists,
  getUserCount,
  getOnlineUserCount,
  clearAllUsers,
  removeInactiveUsers,
  getStatistics,
};
