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
  reviews: [
    {
      reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: Number,
      comment: String,
    }
  ],
});

module.exports = mongoose.model('User', userSchema); 