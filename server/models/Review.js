const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate reviews for the same match by the same user
reviewSchema.index({ reviewerId: 1, matchId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
