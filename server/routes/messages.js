const express = require('express');
const Message = require('../models/Message');
const router = express.Router();

// Send a message
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    console.log('Message send request:', { senderId, receiverId, message }); // Debug log

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const msg = new Message({ senderId, receiverId, message });
    const savedMessage = await msg.save();
    console.log('Message saved:', savedMessage); // Debug log

    res.status(201).json({ message: 'Message sent.', data: savedMessage });
  } catch (err) {
    console.error('Error sending message:', err); // Debug log
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// IMPORTANT: This route MUST come before /:userId/:otherUserId to avoid "all" being matched as otherUserId
// Get all unique conversations for a user (including accepted matches)
router.get('/:userId/all', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Fetching conversations for user:', userId);

    // Validate userId is a proper ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get existing message conversations
    const messages = await Message.find({
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }]
    }).sort('-timestamp').populate('senderId', 'name').populate('receiverId', 'name');

    console.log('Found messages:', messages.length);

    // Group by other user and count unread
    const convMap = {};
    messages.forEach(msg => {
      // Handle cases where user might not be populated
      if (!msg.senderId || !msg.receiverId) return;

      const senderId = msg.senderId._id ? msg.senderId._id.toString() : msg.senderId.toString();
      const receiverId = msg.receiverId._id ? msg.receiverId._id.toString() : msg.receiverId.toString();

      const isCurrentUserSender = senderId === userId;
      const otherUser = isCurrentUserSender ? msg.receiverId : msg.senderId;
      const otherUserId = isCurrentUserSender ? receiverId : senderId;
      const otherUserName = otherUser.name || 'User';

      if (!convMap[otherUserId]) {
        convMap[otherUserId] = {
          otherUserId,
          otherUserName,
          lastMessage: msg.message,
          lastTimestamp: msg.timestamp,
          isSystemMessage: msg.isSystemMessage || false,
          hasMessages: true,
          unreadCount: 0
        };
      }

      // Count unread messages (messages TO current user that are not read)
      if (!isCurrentUserSender && !msg.isRead) {
        convMap[otherUserId].unreadCount++;
      }
    });

    // Also get accepted matches that don't have messages yet
    const Match = require('../models/Match');

    const acceptedMatches = await Match.find({
      $or: [{ requesterId: userObjectId }, { offererId: userObjectId }],
      status: 'accepted'
    }).populate('requesterId', 'name').populate('offererId', 'name');

    console.log('Found accepted matches:', acceptedMatches.length);

    // Add accepted matches to conversation list if not already there
    for (const match of acceptedMatches) {
      if (!match.requesterId || !match.offererId) continue;

      const requesterId = match.requesterId._id ? match.requesterId._id.toString() : match.requesterId.toString();
      const offererId = match.offererId._id ? match.offererId._id.toString() : match.offererId.toString();

      const isCurrentUserRequester = requesterId === userId;
      const otherUser = isCurrentUserRequester ? match.offererId : match.requesterId;
      const otherUserId = isCurrentUserRequester ? offererId : requesterId;
      const otherUserName = otherUser.name || 'User';

      if (!convMap[otherUserId]) {
        convMap[otherUserId] = {
          otherUserId,
          otherUserName,
          lastMessage: `Matched for ${match.skillName} - Start chatting!`,
          lastTimestamp: match.updatedAt,
          isSystemMessage: true,
          hasMessages: false,
          skillName: match.skillName
        };
      }
    }

    const conversations = Object.values(convMap).sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));

    console.log('Total conversations (messages + matches):', conversations.length);
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get all messages with a user (threaded)
router.get('/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    console.log('Fetching messages between:', userId, 'and', otherUserId); // Debug log

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    }).sort('timestamp');

    console.log('Found messages:', messages.length); // Debug log
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err); // Debug log
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// Mark all messages from a sender as read
router.post('/mark-read/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    // Mark all messages FROM otherUser TO currentUser as read
    const result = await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      { isRead: true }
    );

    console.log(`Marked ${result.modifiedCount} messages as read`);
    res.json({ success: true, markedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router; 