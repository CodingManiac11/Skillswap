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

// Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { name, bio, location, availability } = req.body;
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (availability !== undefined) user.availability = availability;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');
    res.json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router; 