const express = require('express');
const User = require('../models/User');
const Skill = require('../models/Skill');
const router = express.Router();

// Get skill matches for a user
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const matches = await Skill.find({
      $or: [
        { type: 'offer', skillName: { $in: user.skillsRequested } },
        { type: 'request', skillName: { $in: user.skillsOffered } },
      ],
    }).populate('userId', 'name location');
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router; 