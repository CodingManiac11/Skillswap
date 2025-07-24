const express = require('express');
const Message = require('../models/Message');
const router = express.Router();

// Send a message
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const msg = new Message({ senderId, receiverId, message });
    await msg.save();
    res.status(201).json({ message: 'Message sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all messages with a user (threaded)
router.get('/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    }).sort('timestamp');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all unique conversations for a user
router.get('/:userId/all', async (req, res) => {
  try {
    const userId = req.params.userId;
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort('-timestamp').populate('senderId', 'name').populate('receiverId', 'name');

    // Group by other user
    const convMap = {};
    messages.forEach(msg => {
      const otherUser = msg.senderId._id.toString() === userId ? msg.receiverId : msg.senderId;
      const otherUserId = otherUser._id.toString();
      if (!convMap[otherUserId]) {
        convMap[otherUserId] = {
          otherUserId,
          otherUserName: otherUser.name,
          lastMessage: msg.message,
          lastTimestamp: msg.timestamp
        };
      }
    });

    const conversations = Object.values(convMap);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router; 