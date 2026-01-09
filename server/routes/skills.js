const express = require('express');
const Skill = require('../models/Skill');
const User = require('../models/User');
const Match = require('../models/Match');
const router = express.Router();

// Get all skill posts
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find().populate('userId', 'name location');
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Post a new skill (offer/request)
router.post('/', async (req, res) => {
  try {
    const { userId, type, skillName, description, availability, location } = req.body;
    if (!userId || !type || !skillName) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const skill = new Skill({ userId, type, skillName, description, availability, location });
    await skill.save();
    res.status(201).json({ message: 'Skill posted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get skills posted by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.params.userId }).populate('userId', 'name location').sort('-timestamp');
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Delete a skill (only by the user who created it)
router.delete('/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const { userId } = req.body; // User attempting to delete
    
    console.log('Delete skill request:', { skillId, userId });
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    
    // Find the skill
    const skill = await Skill.findById(skillId);
    if (!skill) {
      console.log('Skill not found:', skillId);
      return res.status(404).json({ message: 'Skill not found.' });
    }
    
    console.log('Found skill:', { skillUserId: skill.userId, requestUserId: userId });
    
    // Check if the user is the owner of the skill
    if (skill.userId.toString() !== userId.toString()) {
      console.log('Unauthorized delete attempt');
      return res.status(403).json({ message: 'You can only delete your own skills.' });
    }
    
    // Delete the skill
    await Skill.findByIdAndDelete(skillId);
    console.log('Skill deleted successfully');
    
    // Also clean up any matches related to this skill
    await Match.deleteMany({ skillId: skillId });
    console.log('Related matches cleaned up');
    
    res.json({ message: 'Skill deleted successfully.' });
  } catch (err) {
    console.error('Error deleting skill:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router; 