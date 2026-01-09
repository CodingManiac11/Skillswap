const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// MongoDB connection test
const MONGO_URI = 'mongodb+srv://adityautsav1901:M8WLtVD3zgae7UZs@cluster0.zfgor4s.mongodb.net/skillswap?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected to skillswap database');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Simple user test route
app.get('/test/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({}, { password: 0, debugPassword: 0 });
    res.json({ 
      success: true, 
      count: users.length, 
      users: users.map(u => ({ id: u._id, name: u.name, email: u.email }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`📍 Test it: http://localhost:${PORT}/test`);
});