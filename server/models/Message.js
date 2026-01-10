const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isSystemMessage: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false }, // Track if receiver has read the message
});

module.exports = mongoose.model('Message', messageSchema); 