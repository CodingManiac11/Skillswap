const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const router = express.Router();

// Send a message
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    console.log('Message send request:', { senderId, receiverId, message });

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Check if either user has blocked the other
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if sender is blocked by receiver
    if (receiver.blockedUsers && receiver.blockedUsers.some(id => id.toString() === senderId)) {
      return res.status(403).json({ message: 'You cannot send messages to this user.', blocked: true });
    }

    // Check if receiver is blocked by sender
    if (sender.blockedUsers && sender.blockedUsers.some(id => id.toString() === receiverId)) {
      return res.status(403).json({ message: 'You have blocked this user. Unblock them to send messages.', blocked: true });
    }

    const msg = new Message({ senderId, receiverId, message });
    const savedMessage = await msg.save();
    console.log('Message saved:', savedMessage);

    res.status(201).json({ message: 'Message sent.', data: savedMessage });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// IMPORTANT: Routes with specific path segments MUST come before generic /:userId/:otherUserId
// Get all unique conversations for a user (including accepted matches)
router.get('/:userId/all', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Fetching conversations for user:', userId);

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const messages = await Message.find({
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }]
    }).sort('-timestamp').populate('senderId', 'name').populate('receiverId', 'name');

    console.log('Found messages:', messages.length);

    const convMap = {};
    messages.forEach(msg => {
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

      if (!isCurrentUserSender && !msg.isRead) {
        convMap[otherUserId].unreadCount++;
      }
    });

    const Match = require('../models/Match');
    const acceptedMatches = await Match.find({
      $or: [{ requesterId: userObjectId }, { offererId: userObjectId }],
      status: 'accepted'
    }).populate('requesterId', 'name').populate('offererId', 'name');

    console.log('Found accepted matches:', acceptedMatches.length);

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

// Mark all messages from a sender as read
router.post('/mark-read/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const result = await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: userId,
        isRead: { $ne: true }
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

// BLOCK ROUTES - Must come BEFORE /:userId/:otherUserId to avoid "block-status" being matched as userId

// Check if a user is blocked
router.get('/block-status/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    console.log('Checking block status:', userId, otherUserId);

    const currentUser = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);

    if (!currentUser || !otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const iBlockedThem = currentUser.blockedUsers && currentUser.blockedUsers.some(id => id.toString() === otherUserId);
    const theyBlockedMe = otherUser.blockedUsers && otherUser.blockedUsers.some(id => id.toString() === userId);

    res.json({
      iBlockedThem,
      theyBlockedMe,
      canMessage: !iBlockedThem && !theyBlockedMe
    });
  } catch (err) {
    console.error('Error checking block status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Block a user
router.post('/block/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    console.log('Block request:', userId, 'blocking', otherUserId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.blockedUsers && user.blockedUsers.some(id => id.toString() === otherUserId)) {
      return res.json({ message: 'User already blocked', blocked: true });
    }

    if (!user.blockedUsers) {
      user.blockedUsers = [];
    }
    user.blockedUsers.push(otherUserId);
    await user.save();

    console.log(`User ${userId} blocked user ${otherUserId}`);
    res.json({ message: 'User blocked successfully', blocked: true });
  } catch (err) {
    console.error('Error blocking user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Unblock a user
router.post('/unblock/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    console.log('Unblock request:', userId, 'unblocking', otherUserId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.blockedUsers) {
      user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== otherUserId);
      await user.save();
    }

    console.log(`User ${userId} unblocked user ${otherUserId}`);
    res.json({ message: 'User unblocked successfully', blocked: false });
  } catch (err) {
    console.error('Error unblocking user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GENERIC ROUTES - Must come LAST because /:userId/:otherUserId matches anything

// Get all messages with a user (threaded)
router.get('/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    console.log('Fetching messages between:', userId, 'and', otherUserId);

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    }).sort('timestamp');

    console.log('Found messages:', messages.length);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;