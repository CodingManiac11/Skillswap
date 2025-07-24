const express = require('express');
const Skill = require('../models/Skill');
const User = require('../models/User');
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

module.exports = router; 