const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offererId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  skillName: { type: String, required: true },
  // Track who initiated the match request - the OTHER party approves
  // Not required for backward compatibility with old matches
  initiatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed'],
    default: 'pending'
  },
  // Track session completion
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date },
  // Track ratings - who has rated
  ratedByRequester: { type: Boolean, default: false },
  ratedByOfferer: { type: Boolean, default: false },
  // Legacy field - keeping for backward compatibility
  hasBeenRated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Match', matchSchema);