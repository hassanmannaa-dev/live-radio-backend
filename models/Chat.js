function createChat() {
  return {
    messages: [],
    maxMessages: 100,
  };
}

function addMessage(chat, messageData) {
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

  chat.messages.push(message);

  if (chat.messages.length > chat.maxMessages) {
    chat.messages = chat.messages.slice(-chat.maxMessages);
  }

  return message;
}

function getAllMessages(chat) {
  return chat.messages;
}

function getRecentMessages(chat, count = 50) {
  return chat.messages.slice(-count);
}

function getMessagesAfter(chat, timestamp) {
  return chat.messages.filter(
    (msg) => new Date(msg.timestamp) > new Date(timestamp)
  );
}

function clearMessages(chat) {
  chat.messages = [];
}

function getMessageCount(chat) {
  return chat.messages.length;
}

function getMessagesByUser(chat, userId) {
  return chat.messages.filter((msg) => msg.userId === userId);
}

module.exports = {
  createChat,
  addMessage,
  getAllMessages,
  getRecentMessages,
  getMessagesAfter,
  clearMessages,
  getMessageCount,
  getMessagesByUser,
};
