class Chat {
  constructor() {
    this.messages = []; // Store messages in memory (in production, use a database)
    this.maxMessages = 100; // Limit stored messages to prevent memory issues
  }

  // Add a new message to chat history
  addMessage(messageData) {
    const message = {
      id:
        messageData.id ||
        `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: messageData.userId,
      username: messageData.username,
      avatarId: messageData.avatarId,
      message: messageData.message,
      timestamp: messageData.timestamp || new Date().toISOString(),
    };

    this.messages.push(message);

    // Keep only the last maxMessages to prevent memory issues
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    return message;
  }

  // Get all messages
  getAllMessages() {
    return this.messages;
  }

  // Get recent messages (last N messages)
  getRecentMessages(count = 50) {
    return this.messages.slice(-count);
  }

  // Get messages after a specific timestamp
  getMessagesAfter(timestamp) {
    return this.messages.filter(
      (msg) => new Date(msg.timestamp) > new Date(timestamp)
    );
  }

  // Clear all messages
  clearMessages() {
    this.messages = [];
  }

  // Get message count
  getMessageCount() {
    return this.messages.length;
  }

  // Get messages by user
  getMessagesByUser(userId) {
    return this.messages.filter((msg) => msg.userId === userId);
  }
}

module.exports = Chat;
