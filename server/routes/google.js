const express = require('express');
const { google } = require('googleapis');
const User = require('../models/User');
const router = express.Router();

// Google OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Scopes needed for Google Calendar (which includes Meet)
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

// Step 1: Initiate OAuth flow - redirect user to Google
router.get('/auth/:userId', (req, res) => {
    const { userId } = req.params;

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        state: userId, // Pass userId to callback
        prompt: 'consent' // Force consent to get refresh token
    });

    res.redirect(authUrl);
});

// Step 2: Handle OAuth callback from Google
router.get('/callback', async (req, res) => {
    const { code, state: userId } = req.query;

    if (!code) {
        return res.status(400).send('Authorization code missing');
    }

    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Save tokens to user document
        await User.findByIdAndUpdate(userId, {
            googleTokens: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date
            }
        });

        console.log('Google tokens saved for user:', userId);

        // Redirect back to the app
        const redirectUrl = process.env.NODE_ENV === 'production'
            ? '/chats'
            : 'http://localhost:3000/chats';

        res.redirect(redirectUrl + '?google_connected=true');
    } catch (err) {
        console.error('Error exchanging code for tokens:', err);
        res.status(500).send('Failed to authenticate with Google');
    }
});

// Step 3: Check if user has Google connected
router.get('/status/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        const isConnected = !!(user?.googleTokens?.refresh_token);
        res.json({ connected: isConnected });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Step 4: Create a Google Meet link
router.post('/create-meeting', async (req, res) => {
    const { userId, title, otherUserName, duration = 60 } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user?.googleTokens?.refresh_token) {
            return res.status(401).json({
                error: 'Google not connected',
                authUrl: `/google/auth/${userId}`
            });
        }

        // Set credentials
        oauth2Client.setCredentials({
            access_token: user.googleTokens.access_token,
            refresh_token: user.googleTokens.refresh_token,
            expiry_date: user.googleTokens.expiry_date
        });

        // Refresh token if expired
        if (user.googleTokens.expiry_date < Date.now()) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);

            // Update stored tokens
            await User.findByIdAndUpdate(userId, {
                'googleTokens.access_token': credentials.access_token,
                'googleTokens.expiry_date': credentials.expiry_date
            });
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Create event with Google Meet
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + duration * 60000);

        const event = {
            summary: title || `SkillSwap Session with ${otherUserName}`,
            description: 'Skill exchange session created via SkillSwap',
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'Asia/Kolkata'
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Asia/Kolkata'
            },
            conferenceData: {
                createRequest: {
                    requestId: `skillswap-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            }
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1
        });

        const meetLink = response.data.hangoutLink;

        res.json({
            success: true,
            meetLink,
            eventId: response.data.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
        });

    } catch (err) {
        console.error('Error creating meeting:', err);

        // If token is invalid, prompt re-auth
        if (err.message?.includes('invalid_grant') || err.code === 401) {
            return res.status(401).json({
                error: 'Google session expired',
                authUrl: `/google/auth/${userId}`
            });
        }

        res.status(500).json({ error: 'Failed to create meeting: ' + err.message });
    }
});

module.exports = router;
