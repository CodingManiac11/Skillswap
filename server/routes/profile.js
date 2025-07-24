const express = require('express');
const User = require('../models/User');
const Skill = require('../models/Skill');
const router = express.Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const skillsOffered = await Skill.find({ userId: user._id, type: 'offer' });
    const skillsRequested = await Skill.find({ userId: user._id, type: 'request' });
    res.json({ ...user.toObject(), skillsOffered, skillsRequested });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router; 