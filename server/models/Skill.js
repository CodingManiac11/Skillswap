const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['offer', 'request'], required: true },
  skillName: { type: String, required: true },
  description: { type: String, default: '' },
  availability: { type: String, default: '' },
  location: { type: String, default: '' },
  // Verification fields
  proofUrl: { type: String, default: '' }, // Optional: link to portfolio, certificate, etc.
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Skill category for filtering
  category: {
    type: String,
    enum: ['technology', 'music', 'languages', 'arts', 'sports', 'academics', 'business', 'lifestyle', 'other'],
    default: 'other'
  },
  // Experience level
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    default: 'intermediate'
  },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Skill', skillSchema); 