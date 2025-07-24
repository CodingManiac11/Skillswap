const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Post a review for a user
router.post('/:userId', async (req, res) => {
  try {
    const { reviewerId, rating, comment } = req.body;
    if (!reviewerId || !rating) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.reviews.push({ reviewerId, rating, comment });
    await user.save();
    res.status(201).json({ message: 'Review posted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all reviews for a user
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('reviews.reviewerId', 'name');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user.reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router; 