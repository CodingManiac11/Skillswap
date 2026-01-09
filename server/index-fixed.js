const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = 'mongodb+srv://adityautsav1901:M8WLtVD3zgae7UZs@cluster0.zfgor4s.mongodb.net/skillswap?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected to skillswap database');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Import models
const User = require('./models/User');
const Skill = require('./models/Skill');
const Message = require('./models/Message');
const Match = require('./models/Match');

// Routes
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

// Debug routes
app.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SkillSwap API is running',
    endpoints: {
      auth: '/auth/register, /auth/login',
      skills: '/skills',
      messages: '/messages/send, /messages/:userId/:otherUserId',
      debug: '/debug/users, /debug/skills, /debug/messages'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
});