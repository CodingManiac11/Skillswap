const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  debugPassword: { type: String }, // TEMPORARY - for development only
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  availability: { type: String, default: '' },
  skillsOffered: [{ type: String }],
  skillsRequested: [{ type: String }],
  // Aggregate rating fields
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  reviews: [
    {
      reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
      rating: Number,
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  // Google OAuth tokens for Meet integration
  googleTokens: {
    access_token: String,
    refresh_token: String,
    expiry_date: Number
  },
  // Admin & Verification
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  // Account status
  isBanned: { type: Boolean, default: false },
  bannedAt: { type: Date },
  bannedReason: { type: String },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date }
});

module.exports = mongoose.model('User', userSchema); 