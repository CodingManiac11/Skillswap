const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.'
      });
    }

    // Only allow Gmail addresses
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'Only Gmail addresses are allowed. Please use a @gmail.com email.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      debugPassword: password // TEMPORARY - for development only
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        message: 'Your account has been suspended.' + (user.bannedReason ? ` Reason: ${user.bannedReason}` : ''),
        banned: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router; 