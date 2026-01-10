const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || true] // Allow same origin in production
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

// Socket.IO with dynamic CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected to skillswap database');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Socket.IO connection handling
const onlineUsers = new Map(); // Map of userId -> socketId

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // User joins with their userId
  socket.on('user_online', (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} is now online (socket: ${socket.id})`);
    }
  });

  // Join a chat room (conversation between two users)
  socket.on('join_chat', ({ userId, otherUserId }) => {
    // Create unique room ID for this conversation
    const roomId = [userId, otherUserId].sort().join('_');
    socket.join(roomId);
    console.log(`💬 User ${userId} joined chat room: ${roomId}`);
  });

  // Leave a chat room
  socket.on('leave_chat', ({ userId, otherUserId }) => {
    const roomId = [userId, otherUserId].sort().join('_');
    socket.leave(roomId);
    console.log(`👋 User ${userId} left chat room: ${roomId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    const { senderId, receiverId, message } = data;
    console.log(`📨 Message from ${senderId} to ${receiverId}: ${message}`);

    try {
      // Save message to database
      const Message = require('./models/Message');
      const newMessage = new Message({
        senderId,
        receiverId,
        message,
        timestamp: new Date()
      });
      const savedMessage = await newMessage.save();

      // Broadcast to the chat room
      const roomId = [senderId, receiverId].sort().join('_');
      io.to(roomId).emit('receive_message', {
        _id: savedMessage._id,
        senderId,
        receiverId,
        message,
        timestamp: savedMessage.timestamp
      });

      // Also send to receiver's socket directly if they're online but not in room
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message_notification', {
          senderId,
          message,
          timestamp: savedMessage.timestamp
        });
      }

      console.log(`✅ Message delivered to room ${roomId}`);
    } catch (err) {
      console.error('Error saving/sending message:', err);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', ({ userId, otherUserId, isTyping }) => {
    const roomId = [userId, otherUserId].sort().join('_');
    socket.to(roomId).emit('user_typing', { userId, isTyping });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove user from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`🔴 User ${userId} went offline`);
        break;
      }
    }
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const skillsRoutes = require('./routes/skills');
app.use('/skills', skillsRoutes);

const matchRoutes = require('./routes/match');
app.use('/users/matches', matchRoutes);

const messagesRoutes = require('./routes/messages');
app.use('/messages', messagesRoutes);

const reviewsRoutes = require('./routes/reviews');
app.use('/reviews', reviewsRoutes);
const profileRoutes = require('./routes/profile');
app.use('/profile', profileRoutes);

const notificationsRoutes = require('./routes/notifications');
app.use('/notifications', notificationsRoutes);

// Debug routes to check database contents
const User = require('./models/User');
const Skill = require('./models/Skill');
const Match = require('./models/Match');

app.get('/debug/check-violin-status', async (req, res) => {
  try {
    const thomasId = '68dfd71a3f5d3bd07ac910e7';
    const georgeId = '68dfd77e3f5d3bd07ac91103';

    // Get all matches between these users
    const matches = await Match.find({
      $or: [
        { requesterId: thomasId, offererId: georgeId },
        { requesterId: georgeId, offererId: thomasId }
      ]
    });

    // Get their skills
    const thomasSkills = await Skill.find({ userId: thomasId });
    const georgeSkills = await Skill.find({ userId: georgeId });

    res.json({
      thomas: {
        id: thomasId,
        skills: thomasSkills.map(s => `${s.type}: ${s.skillName}`)
      },
      george: {
        id: georgeId,
        skills: georgeSkills.map(s => `${s.type}: ${s.skillName}`)
      },
      matches: matches.map(m => ({
        id: m._id,
        skillName: m.skillName,
        status: m.status,
        requester: m.requesterId,
        offerer: m.offererId,
        skillId: m.skillId
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug/force-accept-violin', async (req, res) => {
  try {
    // Force accept all violin matches between Thomas and George
    const thomasId = '68dfd71a3f5d3bd07ac910e7';
    const georgeId = '68dfd77e3f5d3bd07ac91103';

    const result = await Match.updateMany(
      {
        $or: [
          { requesterId: thomasId, offererId: georgeId },
          { requesterId: georgeId, offererId: thomasId }
        ],
        skillName: { $regex: /violin/i }
      },
      {
        status: 'accepted',
        updatedAt: new Date()
      }
    );

    console.log('Force accepted violin matches:', result);

    // Also create a system message if not exists
    const Message = require('./models/Message');
    const existingMessage = await Message.findOne({
      $or: [
        { senderId: thomasId, receiverId: georgeId },
        { senderId: georgeId, receiverId: thomasId }
      ],
      isSystemMessage: true
    });

    if (!existingMessage) {
      const systemMessage = new Message({
        senderId: georgeId, // George as sender
        receiverId: thomasId, // Thomas as receiver
        message: `🎉 Great! You've been matched for Violin. Start chatting to coordinate your skill exchange!`,
        isSystemMessage: true
      });
      await systemMessage.save();
      console.log('Created system message');
    }

    res.json({
      message: 'Force accepted all violin matches',
      modifiedCount: result.modifiedCount,
      systemMessage: !existingMessage ? 'Created' : 'Already exists'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug/fix-matches', async (req, res) => {
  try {
    // Find all matches between Thomas and George for violin
    const thomasId = '68dfd71a3f5d3bd07ac910e7';
    const georgeId = '68dfd77e3f5d3bd07ac91103';

    const matches = await Match.find({
      $or: [
        { requesterId: thomasId, offererId: georgeId },
        { requesterId: georgeId, offererId: thomasId }
      ],
      skillName: { $regex: /violin/i }
    });

    console.log('Found matches between Thomas and George for violin:', matches.length);

    // Keep only the accepted match, delete pending ones
    let keptMatch = null;
    for (const match of matches) {
      if (match.status === 'accepted') {
        keptMatch = match;
      } else if (match.status === 'pending') {
        await Match.findByIdAndDelete(match._id);
        console.log('Deleted pending match:', match._id);
      }
    }

    // If no accepted match, update the first pending to accepted
    if (!keptMatch && matches.length > 0) {
      keptMatch = matches[0];
      keptMatch.status = 'accepted';
      await keptMatch.save();
      console.log('Updated match to accepted:', keptMatch._id);
    }

    res.json({
      message: 'Fixed matches',
      totalMatches: matches.length,
      keptMatch: keptMatch ? {
        id: keptMatch._id,
        status: keptMatch.status,
        skillName: keptMatch.skillName
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude hashed passwords
    res.json({
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        location: u.location
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to see ALL user data including passwords (for debugging)
app.get('/debug/users/passwords', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({
      count: users.length,
      users,
      warning: "⚠️ This shows plain passwords - FOR DEVELOPMENT ONLY!"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug/skills', async (req, res) => {
  try {
    const skills = await Skill.find().populate('userId', 'name email');
    res.json({ count: skills.length, skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug/messages', async (req, res) => {
  try {
    const Message = require('./models/Message');
    const messages = await Message.find().populate('senderId', 'name email').populate('receiverId', 'name email');
    res.json({ count: messages.length, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug/matches', async (req, res) => {
  try {
    const matches = await Match.find().populate('requesterId', 'name email').populate('offererId', 'name email').populate('skillId');
    res.json({ count: matches.length, matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Production: Serve React build
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing - serve index.html for all non-API routes
  // Express 5 requires named parameters for wildcards
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('SkillSwap API is running');
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.IO enabled`);
}); 