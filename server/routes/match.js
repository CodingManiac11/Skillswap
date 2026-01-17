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
          // The person who DIDN'T initiate the match should approve/decline
          // initiatorId tracks who started the match request
          const initiatorId = existingMatch.initiatorId ? existingMatch.initiatorId.toString() : null;
          const isCurrentUserInitiator = initiatorId === userId;

          if (!isCurrentUserInitiator) {
            // Current user did NOT initiate - they can approve or decline
            actionRequired = 'approve';
            canTakeAction = true;
            waitingFor = null;
          } else {
            // Current user initiated - they wait for the other party
            actionRequired = 'waiting';
            canTakeAction = false;
            waitingFor = 'other_party';
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
          offererId: existingMatch.offererId,
          initiatorId: existingMatch.initiatorId
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
    const { userId, skillId, action, userSkillId, matchId } = req.body;
    const io = req.app.get('io');

    console.log('\n=== MATCH ACTION ===');
    console.log('User:', userId, 'Action:', action, 'Skill:', skillId, 'MatchId:', matchId);

    if (!userId || !action) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!['initiate', 'accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use initiate, accept, or decline.' });
    }

    // For accept/decline, try to use matchId first if provided
    if ((action === 'accept' || action === 'decline') && matchId) {
      console.log('Using matchId for accept/decline:', matchId);
      const match = await Match.findById(matchId);

      if (!match) {
        return res.status(404).json({ message: 'No match request found.' });
      }

      if (match.status !== 'pending') {
        return res.status(400).json({ message: 'This match has already been processed.' });
      }

      // Handle backward compatibility for old matches without initiatorId
      const initiatorId = match.initiatorId ? match.initiatorId.toString() : null;

      if (initiatorId) {
        if (initiatorId === userId) {
          return res.status(403).json({ message: 'You cannot approve/decline your own request. The other party must respond.' });
        }
      } else {
        if (match.offererId.toString() !== userId) {
          return res.status(403).json({ message: 'Only the skill provider can accept or decline match requests.' });
        }
      }

      // Verify user is involved in this match
      const isInvolved = match.requesterId.toString() === userId || match.offererId.toString() === userId;
      if (!isInvolved) {
        return res.status(403).json({ message: 'You are not involved in this match.' });
      }

      // Get current user for notification
      const currentUser = await User.findById(userId);
      if (!currentUser) return res.status(404).json({ message: 'User not found.' });

      // Update match status
      const newStatus = action === 'accept' ? 'accepted' : 'declined';
      match.status = newStatus;
      match.updatedAt = new Date();
      await match.save();

      console.log('Updated match status to:', newStatus);

      if (action === 'accept') {
        // Create system message to start the conversation
        const Message = require('../models/Message');
        const systemMessage = new Message({
          senderId: match.offererId,
          receiverId: match.requesterId,
          message: `🎉 Great! Your match for "${match.skillName}" has been accepted! Start chatting to coordinate your skill exchange!`,
          isSystemMessage: true
        });
        await systemMessage.save();

        // Notify the requester that their request was accepted
        await createNotification({
          userId: match.requesterId,
          type: 'match_accepted',
          title: 'Match Accepted! 🎉',
          message: `${currentUser.name} accepted your request for ${match.skillName}! You can now chat.`,
          relatedUserId: userId,
          relatedMatchId: match._id
        }, io);
      } else {
        // Notify the initiator that their request was declined
        await createNotification({
          userId: match.initiatorId || match.requesterId,
          type: 'match_declined',
          title: 'Match Declined',
          message: `${currentUser.name} declined your request for ${match.skillName}.`,
          relatedUserId: userId,
          relatedMatchId: match._id
        }, io);
      }

      return res.json({
        message: action === 'accept' ? 'Match accepted! You can now chat.' : 'Match request declined.',
        match
      });
    }

    // For initiate action, need skillId
    if (action === 'initiate' && !skillId) {
      return res.status(400).json({ message: 'Skill ID is required to initiate a match.' });
    }

    // Get the skill being matched
    const skill = await Skill.findById(skillId).populate('userId');
    if (!skill) return res.status(404).json({ message: 'Skill not found.' });

    // Check if skill owner still exists
    if (!skill.userId) {
      return res.status(404).json({ message: 'Skill owner no longer exists.' });
    }

    // Get the current user
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ message: 'User not found.' });

    console.log('Skill details:', {
      id: skill._id,
      type: skill.type,
      name: skill.skillName,
      owner: skill.userId?.name || 'Unknown',
      ownerId: skill.userId?._id
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

    // Check if a PENDING match already exists - search by user pair AND skillName
    // Only block if there's a pending request, not if it was already accepted/declined
    let match = await Match.findOne({
      $or: [
        { skillId, status: 'pending' },
        {
          requesterId: requesterId,
          offererId: offererId,
          skillName: { $regex: new RegExp(`^${skill.skillName}$`, 'i') },
          status: 'pending'
        }
      ]
    });

    console.log('Existing pending match:', match ? {
      id: match._id,
      status: match.status,
      requester: match.requesterId.toString(),
      offerer: match.offererId.toString(),
      initiatorId: match.initiatorId ? match.initiatorId.toString() : 'none'
    } : 'None');

    if (action === 'initiate') {
      // User wants to initiate a match
      if (match) {
        return res.status(400).json({ message: 'A pending match request already exists for this skill. Please wait for the other party to respond.' });
      }

      // Determine who should approve: the opposite party from the initiator
      // initiatorId = userId (the current user who initiated)
      // The OTHER party should approve
      const approverUserId = skill.type === 'offer' ? offererId : requesterId;
      const isRequesterInitiating = requesterId.toString() === userId;

      // Create new match with pending status and track who initiated
      match = new Match({
        requesterId,
        offererId,
        skillId,
        skillName: skill.skillName,
        status: 'pending',
        initiatorId: userId // Track who started the match request
      });
      await match.save();

      console.log('Created new match:', match._id, 'Initiator:', userId, 'Approver needed:', approverUserId);

      // Create notification for the person who needs to approve
      const notificationMessage = isRequesterInitiating
        ? `${currentUser.name} wants to learn ${skill.skillName} from you!`
        : `${currentUser.name} offered to teach you ${skill.skillName}!`;

      const notificationTitle = isRequesterInitiating
        ? 'New Learning Request!'
        : 'Someone Offered to Help!';

      await createNotification({
        userId: approverUserId,
        type: 'match_request',
        title: notificationTitle,
        message: notificationMessage,
        relatedUserId: userId,
        relatedMatchId: match._id,
        relatedSkillId: skillId
      }, io);

      const responseMessage = isRequesterInitiating
        ? 'Match request sent! Waiting for approval from the skill provider.'
        : 'Offer sent! Waiting for the requester to accept your offer.';

      res.json({
        message: responseMessage,
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

      // Handle backward compatibility for old matches without initiatorId
      // For old matches, fall back to: offerer approves requests from requester
      const initiatorId = match.initiatorId ? match.initiatorId.toString() : null;

      if (initiatorId) {
        // New system: non-initiator approves
        if (initiatorId === userId) {
          return res.status(403).json({ message: 'You cannot approve/decline your own request. The other party must respond.' });
        }
      } else {
        // Old matches: only offerer can approve (backward compatibility)
        if (match.offererId.toString() !== userId) {
          return res.status(403).json({ message: 'Only the skill provider can accept or decline match requests.' });
        }
      }

      // Verify user is involved in this match
      const isInvolved = match.requesterId.toString() === userId || match.offererId.toString() === userId;
      if (!isInvolved) {
        return res.status(403).json({ message: 'You are not involved in this match.' });
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

// Mark a match session as complete
router.post('/complete', async (req, res) => {
  try {
    const { userId, matchId } = req.body;
    const io = req.app.get('io');

    if (!userId || !matchId) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    // Verify user is involved in this match
    const reqId = match.requesterId?.toString() || '';
    const offId = match.offererId?.toString() || '';
    console.log(`Complete request: userId=${userId}, matchId=${matchId}, reqId=${reqId}, offId=${offId}`);

    const isInvolved = reqId === userId || offId === userId;
    if (!isInvolved) {
      return res.status(403).json({ message: 'You are not involved in this match.' });
    }

    // Check if match is accepted (can only complete accepted matches)
    if (match.status !== 'accepted' && match.status !== 'completed') {
      return res.status(400).json({ message: 'Only accepted matches can be marked as complete.' });
    }

    // If already completed, just return success
    if (match.status === 'completed') {
      return res.json({ message: 'Session already marked as complete.', match });
    }

    // Mark as complete
    match.status = 'completed';
    match.completedBy = userId;
    match.completedAt = new Date();
    match.updatedAt = new Date();
    await match.save();

    // Get user names for notification
    const currentUser = await User.findById(userId);
    const otherUserId = match.requesterId.toString() === userId ? match.offererId : match.requesterId;

    // Create notification for the other user
    const Notification = require('../models/Notification');
    const notification = new Notification({
      userId: otherUserId,
      type: 'session_complete',
      title: 'Session Completed! ⭐',
      message: `${currentUser.name} marked your "${match.skillName}" session as complete. Please leave a review!`,
      relatedUserId: userId,
      relatedMatchId: match._id
    });
    await notification.save();

    // Emit real-time notification
    if (io) {
      io.to(otherUserId.toString()).emit('notification', notification);
    }

    // Create system message in chat
    const Message = require('../models/Message');
    const systemMessage = new Message({
      senderId: userId,
      receiverId: otherUserId,
      message: `✅ ${currentUser.name} marked this session as complete! Please leave a review to help others. 🌟`,
      isSystemMessage: true
    });
    await systemMessage.save();

    console.log(`Session ${matchId} marked complete by ${userId}`);
    res.json({ message: 'Session marked as complete! A review request has been sent.', match });
  } catch (err) {
    console.error('Error completing session:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;