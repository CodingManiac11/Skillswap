const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who receives notification
    type: {
        type: String,
        enum: ['match_request', 'match_accepted', 'match_declined', 'new_message', 'session_complete', 'review_received', 'skill_verified', 'skill_rejected'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The other user involved
    relatedMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    relatedSkillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
