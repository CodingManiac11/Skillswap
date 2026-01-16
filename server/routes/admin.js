const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Skill = require('../models/Skill');
const Match = require('../models/Match');
const Message = require('../models/Message');

// Admin emails that are automatically granted admin access
const ADMIN_EMAILS = [
    'admin@skillswap.com',
    'adityautsav1901@gmail.com'
];

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.adminUserId || req.query.adminUserId;
        if (!userId) {
            return res.status(401).json({ message: 'No user ID provided.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if user is admin by email or isAdmin flag
        if (!user.isAdmin && !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        req.adminUser = user;
        next();
    } catch (err) {
        console.error('Admin auth error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ==================== DASHBOARD STATS ====================

// Get admin dashboard stats
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalSkills = await Skill.countDocuments();
        const totalMatches = await Match.countDocuments();
        const acceptedMatches = await Match.countDocuments({ status: 'accepted' });
        const completedMatches = await Match.countDocuments({ status: 'completed' });
        const pendingVerifications = await Skill.countDocuments({ verificationStatus: 'pending' });
        const verifiedSkills = await Skill.countDocuments({ verificationStatus: 'verified' });
        const bannedUsers = await User.countDocuments({ isBanned: true });

        res.json({
            totalUsers,
            totalSkills,
            totalMatches,
            acceptedMatches,
            completedMatches,
            pendingVerifications,
            verifiedSkills,
            bannedUsers
        });
    } catch (err) {
        console.error('Error getting stats:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ==================== USER MANAGEMENT ====================

// Get all users with pagination
router.get('/users', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';

        const query = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        const users = await User.find(query)
            .select('-password -debugPassword -googleTokens')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update user (verify, ban, make admin)
router.put('/users/:id', isAdmin, async (req, res) => {
    try {
        const { isAdmin: makeAdmin, isVerified, isBanned, bannedReason } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update fields
        if (typeof makeAdmin === 'boolean') user.isAdmin = makeAdmin;
        if (typeof isVerified === 'boolean') {
            user.isVerified = isVerified;
            if (isVerified) user.verifiedAt = new Date();
        }
        if (typeof isBanned === 'boolean') {
            user.isBanned = isBanned;
            if (isBanned) {
                user.bannedAt = new Date();
                user.bannedReason = bannedReason || 'Violated terms of service';
            }
        }

        await user.save();
        res.json({ message: 'User updated successfully.', user });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete user and all their data
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Delete user's skills
        await Skill.deleteMany({ userId: req.params.id });

        // Delete user's matches
        await Match.deleteMany({
            $or: [{ requesterId: req.params.id }, { offererId: req.params.id }]
        });

        // Delete user's messages
        await Message.deleteMany({
            $or: [{ senderId: req.params.id }, { receiverId: req.params.id }]
        });

        // Delete user
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User and all associated data deleted.' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ==================== SKILL VERIFICATION ====================

// Get skills pending verification
router.get('/skills/pending', isAdmin, async (req, res) => {
    try {
        const skills = await Skill.find({
            verificationStatus: 'pending',
            proofUrl: { $exists: true, $ne: '' }
        })
            .populate('userId', 'name email isVerified')
            .sort('-timestamp');

        res.json(skills);
    } catch (err) {
        console.error('Error getting pending skills:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get all skills for admin (with filters)
router.get('/skills', isAdmin, async (req, res) => {
    try {
        const { status, category } = req.query;
        const query = {};
        if (status) query.verificationStatus = status;
        if (category) query.category = category;

        const skills = await Skill.find(query)
            .populate('userId', 'name email isVerified')
            .sort('-timestamp')
            .limit(100);

        res.json(skills);
    } catch (err) {
        console.error('Error getting skills:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Verify or reject a skill
router.put('/skills/:id/verify', isAdmin, async (req, res) => {
    try {
        const { status } = req.body; // 'verified' or 'rejected'

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Use "verified" or "rejected".' });
        }

        const skill = await Skill.findById(req.params.id);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found.' });
        }

        skill.verificationStatus = status;
        if (status === 'verified') {
            skill.verifiedAt = new Date();
            skill.verifiedBy = req.adminUser._id;
        }
        await skill.save();

        // Notify the user
        const Notification = require('../models/Notification');
        const notification = new Notification({
            userId: skill.userId,
            type: status === 'verified' ? 'skill_verified' : 'skill_rejected',
            title: status === 'verified' ? 'Skill Verified! ✅' : 'Verification Not Approved',
            message: status === 'verified'
                ? `Your "${skill.skillName}" skill has been verified! You now have a verified badge.`
                : `Your "${skill.skillName}" skill verification was not approved. Please update your proof and try again.`,
            relatedMatchId: null
        });
        await notification.save();

        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(skill.userId.toString()).emit('notification', notification);
        }

        res.json({ message: `Skill ${status} successfully.`, skill });
    } catch (err) {
        console.error('Error verifying skill:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ==================== CHECK ADMIN STATUS ====================

// Check if current user is admin
router.get('/check', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.userId;
        if (!userId) {
            return res.json({ isAdmin: false });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ isAdmin: false });
        }

        const isAdminUser = user.isAdmin || ADMIN_EMAILS.includes(user.email.toLowerCase());

        // Auto-set isAdmin flag for admin emails
        if (isAdminUser && !user.isAdmin) {
            user.isAdmin = true;
            await user.save();
        }

        res.json({ isAdmin: isAdminUser });
    } catch (err) {
        console.error('Error checking admin:', err);
        res.json({ isAdmin: false });
    }
});

module.exports = router;
