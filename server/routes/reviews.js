const express = require('express');
const User = require('../models/User');
const Match = require('../models/Match');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// All review routes require authentication
router.use(authMiddleware);

/**
 * Helper function to recalculate and update user's aggregate rating
 */
const updateUserAverageRating = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.reviews || user.reviews.length === 0) {
    return;
  }

  const totalRating = user.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  const ratingCount = user.reviews.length;
  const averageRating = Math.round((totalRating / ratingCount) * 10) / 10; // Round to 1 decimal

  await User.findByIdAndUpdate(userId, {
    averageRating,
    ratingCount
  });

  return { averageRating, ratingCount };
};

/**
 * Post a review for a user
 * Only the REQUESTER can rate the OFFERER after an ACCEPTED match
 */
router.post('/:userId', async (req, res) => {
  try {
    const { matchId, rating, comment } = req.body;
    const reviewerId = req.user.id; // Get from auth token, not body
    const targetUserId = req.params.userId;

    // Validation
    if (!matchId) {
      return res.status(400).json({ message: 'matchId is required. You can only rate someone after a successful skill exchange.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    // Prevent self-review
    if (reviewerId === targetUserId) {
      return res.status(400).json({ message: 'You cannot review yourself.' });
    }

    // Verify the match exists and is accepted
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    if (match.status !== 'accepted') {
      return res.status(400).json({ message: 'You can only rate after a match has been accepted.' });
    }

    // Verify the reviewer is the REQUESTER of this match
    if (match.requesterId.toString() !== reviewerId) {
      return res.status(403).json({ message: 'Only the skill requester can rate the skill offerer.' });
    }

    // Verify the target user is the OFFERER of this match
    if (match.offererId.toString() !== targetUserId) {
      return res.status(400).json({ message: 'You can only rate the skill offerer from this match.' });
    }

    // Check if this match has already been rated
    if (match.hasBeenRated) {
      return res.status(400).json({ message: 'This match has already been rated.' });
    }

    // Get the target user
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if reviewer already reviewed this match (belt and suspenders check)
    const existingReview = user.reviews.find(r => r.matchId && r.matchId.toString() === matchId);
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this skill exchange.' });
    }

    // Add the review
    user.reviews.push({
      reviewerId,
      matchId,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date()
    });
    await user.save();

    // Mark the match as rated
    match.hasBeenRated = true;
    await match.save();

    // Update aggregate rating
    const ratingStats = await updateUserAverageRating(targetUserId);

    res.status(201).json({
      message: 'Review posted successfully.',
      averageRating: ratingStats?.averageRating,
      ratingCount: ratingStats?.ratingCount
    });
  } catch (err) {
    console.error('Error posting review:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all reviews for a user
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('reviews.reviewerId', 'name')
      .populate('reviews.matchId', 'skillName');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      reviews: user.reviews,
      averageRating: user.averageRating,
      ratingCount: user.ratingCount
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * Get matches that the current user can rate
 * These are accepted matches where user is the requester and hasn't rated yet
 */
router.get('/ratable-matches/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify user is requesting their own ratable matches
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const ratableMatches = await Match.find({
      requesterId: userId,
      status: 'accepted',
      hasBeenRated: false
    })
      .populate('offererId', 'name')
      .populate('skillId', 'skillName');

    res.json(ratableMatches);
  } catch (err) {
    console.error('Error fetching ratable matches:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;