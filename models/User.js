const UserModel = {
  id: null, // Unique identifier (string)
  name: null, // User display name (string)
  avatarId: null, // Avatar identifier (number/string)
  socketId: null, // Socket.io connection ID (string)
  joinedAt: null, // Date when user joined (Date)
  isOnline: false, // Online status (boolean)
  lastActivity: null, // Last activity timestamp (Date)
};

module.exports = UserModel;
