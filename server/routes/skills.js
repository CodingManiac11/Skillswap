const express = require('express');
const Skill = require('../models/Skill');
const User = require('../models/User');
const Match = require('../models/Match');
const router = express.Router();

// Get all skill posts
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find().populate('userId', 'name location isVerified');
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Post a new skill (offer/request)
router.post('/', async (req, res) => {
  try {
    const { userId, type, skillName, description, availability, location, proofUrl, category, experienceLevel } = req.body;
    if (!userId || !type || !skillName) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Set verification status to pending if proof URL is provided
    const verificationStatus = proofUrl && proofUrl.trim() ? 'pending' : 'unverified';

    const skill = new Skill({
      userId,
      type,
      skillName,
      description,
      availability,
      location,
      proofUrl: proofUrl || '',
      category: category || 'other',
      experienceLevel: experienceLevel || 'intermediate',
      verificationStatus
    });
    await skill.save();

    console.log(`Skill posted: ${skillName} by ${userId}, proofUrl: ${proofUrl || 'none'}, status: ${verificationStatus}`);
    res.status(201).json({ message: 'Skill posted successfully.', skill });
  } catch (err) {
    console.error('Error posting skill:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get skills posted by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.params.userId }).populate('userId', 'name location isVerified').sort('-timestamp');
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

// Update a skill (only by the user who created it)
router.put('/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const { userId, skillName, description, availability, location, type } = req.body;

    console.log('Update skill request:', { skillId, userId });

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Find the skill
    const skill = await Skill.findById(skillId);
    if (!skill) {
      console.log('Skill not found:', skillId);
      return res.status(404).json({ message: 'Skill not found.' });
    }

    // Check if the user is the owner of the skill
    if (skill.userId.toString() !== userId.toString()) {
      console.log('Unauthorized edit attempt');
      return res.status(403).json({ message: 'You can only edit your own skills.' });
    }

    // Update fields if provided
    if (skillName !== undefined) skill.skillName = skillName;
    if (description !== undefined) skill.description = description;
    if (availability !== undefined) skill.availability = availability;
    if (location !== undefined) skill.location = location;
    if (type !== undefined && (type === 'offer' || type === 'request')) skill.type = type;

    await skill.save();

    // Return updated skill with populated user
    const updatedSkill = await Skill.findById(skillId).populate('userId', 'name location');
    console.log('Skill updated successfully');

    res.json({ message: 'Skill updated successfully.', skill: updatedSkill });
  } catch (err) {
    console.error('Error updating skill:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router; 