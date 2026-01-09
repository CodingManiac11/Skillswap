const express = require('express');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const router = express.Router();

// Helper function to create notification
const createNotification = async (data, io) => {
  try {
    const notification = new Notification(data);
    await notification.save();

    // Emit real-time notification via Socket.IO
    if (io) {
      io.emit('new_notification', {
        userId: data.userId.toString(),
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        }
      });
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Get skill matches for a user
// This returns potential matches: skills where user's OFFER matches others' REQUESTs (and vice versa)
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('\n=== GETTING MATCHES FOR USER:', userId, '===');

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Get all skills posted by this user
    const userSkills = await Skill.find({ userId: userId });
    console.log('User has', userSkills.length, 'skills:', userSkills.map(s => `${s.type}: ${s.skillName}`));

    let potentialMatches = [];

    // For each skill the user has posted, find matching opposite skills from OTHER users
    for (const userSkill of userSkills) {
      const oppositeType = userSkill.type === 'offer' ? 'request' : 'offer';

      // Find skills with same name but opposite type from OTHER users
      const matches = await Skill.find({
        skillName: { $regex: new RegExp(`^${userSkill.skillName}$`, 'i') }, // Exact match, case insensitive
        type: oppositeType,
        userId: { $ne: userId } // Exclude user's own skills
      }).populate('userId', 'name location');

      console.log(`For user's ${userSkill.type} "${userSkill.skillName}", found ${matches.length} ${oppositeType} matches`);

      // Add context about which user skill this match relates to
      for (const match of matches) {
        potentialMatches.push({
          ...match.toObject(),
          userSkillId: userSkill._id,
          userSkillType: userSkill.type,
          userSkillName: userSkill.skillName,
          // Determine roles based on skill types
          // If user OFFERS and sees a REQUEST: user is offerer, other is requester
          // If user REQUESTS and sees an OFFER: user is requester, other is offerer
          isUserOfferer: userSkill.type === 'offer',
          isUserRequester: userSkill.type === 'request'
        });
      }
    }

    console.log('Total potential matches:', potentialMatches.length);

    // Get existing matches where this user is involved
    const existingMatches = await Match.find({
      $or: [
        { requesterId: userId },
        { offererId: userId }
      ]
    });

    console.log('Existing matches for user:', existingMatches.length);

    // Add match status and action info to each potential match
    const matchesWithStatus = potentialMatches.map(skill => {
      // Find existing match for this skill pair
      // Match can be found by skillId OR by checking the user pair
      const existingMatch = existingMatches.find(match => {
        const matchSkillId = match.skillId.toString();
        const skillId = skill._id.toString();
        const userSkillId = skill.userSkillId.toString();

        // Check if this match involves these skills
        return matchSkillId === skillId || matchSkillId === userSkillId;
      });

      let actionRequired = 'none';
      let canTakeAction = false;
      let matchStatus = 'none';
      let waitingFor = null;

      if (existingMatch) {
        matchStatus = existingMatch.status;

        if (existingMatch.status === 'pending') {
          // Determine if current user can take action
          // Only the OFFERER can accept/decline
          const isCurrentUserOfferer = existingMatch.offererId.toString() === userId;

          if (isCurrentUserOfferer) {
            actionRequired = 'approve';
            canTakeAction = true;
            waitingFor = null;
          } else {
            actionRequired = 'waiting';
            canTakeAction = false;
            waitingFor = 'offerer';
          }
        } else if (existingMatch.status === 'accepted') {
          actionRequired = 'chat';
          canTakeAction = true;
        }
      } else {
        // No existing match - user can initiate
        // If user sees an OFFER (user is requesting), they can request match
        // If user sees a REQUEST (user is offering), they can offer to help
        if (skill.isUserRequester && skill.type === 'offer') {
          actionRequired = 'request_match';
          canTakeAction = true;
        } else if (skill.isUserOfferer && skill.type === 'request') {
          actionRequired = 'offer_to_help';
          canTakeAction = true;
        }
      }

      return {
        ...skill,
        matchStatus,
        matchId: existingMatch ? existingMatch._id : null,
        actionRequired,
        canTakeAction,
        waitingFor,
        existingMatchInfo: existingMatch ? {
          requesterId: existingMatch.requesterId,
          offererId: existingMatch.offererId
        } : null
      };
    });

    // Remove duplicates (same skill showing multiple times)
    const uniqueMatches = [];
    const seenSkillIds = new Set();
    for (const match of matchesWithStatus) {
      if (!seenSkillIds.has(match._id.toString())) {
        seenSkillIds.add(match._id.toString());
        uniqueMatches.push(match);
      }
    }

    console.log('Returning', uniqueMatches.length, 'unique matches');
    res.json(uniqueMatches);
  } catch (err) {
    console.error('Error getting matches:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Create or update a match (initiate/accept/decline)
router.post('/action', async (req, res) => {
  try {
    const { userId, skillId, action, userSkillId } = req.body;
    const io = req.app.get('io');

    console.log('\n=== MATCH ACTION ===');
    console.log('User:', userId, 'Action:', action, 'Skill:', skillId);

    if (!userId || !skillId || !action) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!['initiate', 'accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use initiate, accept, or decline.' });
    }

    // Get the skill being matched
    const skill = await Skill.findById(skillId).populate('userId');
    if (!skill) return res.status(404).json({ message: 'Skill not found.' });

    // Get the current user
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ message: 'User not found.' });

    console.log('Skill details:', {
      id: skill._id,
      type: skill.type,
      name: skill.skillName,
      owner: skill.userId.name,
      ownerId: skill.userId._id
    });

    // Determine who is the requester and who is the offerer
    // The skill owner's type determines their role
    let requesterId, offererId;
    if (skill.type === 'offer') {
      // Skill is an OFFER - skill owner is the offerer
      // Current user is requesting this skill (they need it)
      requesterId = userId;
      offererId = skill.userId._id;
    } else {
      // Skill is a REQUEST - skill owner is the requester
      // Current user is offering to help (they have it)
      requesterId = skill.userId._id;
      offererId = userId;
    }

    console.log('Match roles:', {
      requesterId: requesterId.toString(),
      offererId: offererId.toString(),
      skillOwnerType: skill.type
    });

    // Check if match already exists
    let match = await Match.findOne({ skillId });

    console.log('Existing match:', match ? {
      id: match._id,
      status: match.status,
      requester: match.requesterId.toString(),
      offerer: match.offererId.toString()
    } : 'None');

    if (action === 'initiate') {
      // User wants to initiate a match
      if (match) {
        return res.status(400).json({ message: 'Match request already exists for this skill.' });
      }

      // Create new match with pending status
      match = new Match({
        requesterId,
        offererId,
        skillId,
        skillName: skill.skillName,
        status: 'pending'
      });
      await match.save();

      console.log('Created new match:', match._id);

      // Create notification for the offerer (they need to approve)
      await createNotification({
        userId: offererId,
        type: 'match_request',
        title: 'New Match Request!',
        message: `${currentUser.name} wants to learn ${skill.skillName} from you!`,
        relatedUserId: userId,
        relatedMatchId: match._id,
        relatedSkillId: skillId
      }, io);

      res.json({
        message: 'Match request sent! Waiting for approval from the skill provider.',
        match
      });

    } else if (action === 'accept' || action === 'decline') {
      // User wants to approve or decline a match
      if (!match) {
        return res.status(404).json({ message: 'No match request found.' });
      }

      if (match.status !== 'pending') {
        return res.status(400).json({ message: 'This match has already been processed.' });
      }

      // Only the OFFERER can accept/decline
      if (match.offererId.toString() !== userId) {
        return res.status(403).json({ message: 'Only the skill provider can accept or decline match requests.' });
      }

      // Update match status
      const newStatus = action === 'accept' ? 'accepted' : 'declined';
      match.status = newStatus;
      match.updatedAt = new Date();
      await match.save();

      console.log('Updated match status to:', newStatus);

      // Get the requester user for notification
      const requester = await User.findById(match.requesterId);

      if (action === 'accept') {
        // Create system message to start the conversation
        const Message = require('../models/Message');
        const systemMessage = new Message({
          senderId: match.offererId,
          receiverId: match.requesterId,
          message: `🎉 Great! Your match for "${skill.skillName}" has been accepted! Start chatting to coordinate your skill exchange!`,
          isSystemMessage: true
        });
        await systemMessage.save();

        // Notify the requester that their request was accepted
        await createNotification({
          userId: match.requesterId,
          type: 'match_accepted',
          title: 'Match Accepted! 🎉',
          message: `${currentUser.name} accepted your request for ${skill.skillName}! You can now chat.`,
          relatedUserId: userId,
          relatedMatchId: match._id,
          relatedSkillId: skillId
        }, io);

        console.log('Created system message for new match');
      } else {
        // Notify the requester that their request was declined
        await createNotification({
          userId: match.requesterId,
          type: 'match_declined',
          title: 'Match Declined',
          message: `${currentUser.name} declined your request for ${skill.skillName}.`,
          relatedUserId: userId,
          relatedMatchId: match._id,
          relatedSkillId: skillId
        }, io);
      }

      res.json({
        message: action === 'accept' ? 'Match accepted! You can now chat.' : 'Match request declined.',
        match
      });
    }

  } catch (err) {
    console.error('Error managing match:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get all matches where user is involved (for history/review)
router.get('/:userId/all', async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [
        { requesterId: req.params.userId },
        { offererId: req.params.userId }
      ]
    })
      .populate('requesterId', 'name email')
      .populate('offererId', 'name email')
      .populate('skillId')
      .sort('-createdAt');

    res.json(matches);
  } catch (err) {
    console.error('Error getting all matches:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;