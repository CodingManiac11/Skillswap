# 🔁 SkillSwap

**SkillSwap** is a full-stack web application designed to help individuals in local communities connect and exchange skills with one another — without the use of money. Whether you're offering guitar lessons and looking to learn web design, or teaching yoga while seeking cooking tips, SkillSwap matches you with the right people.

## 🌐 Live Demo

🔗 **[https://skillswap-aadi-community.up.railway.app/](https://skillswap-aadi-community.up.railway.app/)**

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React.js, Tailwind CSS, Socket.IO Client |
| **Backend** | Node.js, Express.js, Socket.IO |
| **Database** | MongoDB (Mongoose ODM) |
| **Auth** | JWT, bcrypt.js |
| **Integrations** | Google OAuth, Google Calendar API |
| **Deployment** | Railway |

---

## 🚀 Features

### 📚 Skill Management
- **Offer Skills** - Share what you can teach others
- **Request Skills** - Find teachers for skills you want to learn
- **Categories** - Technology, Arts, Languages, Business, Health, Lifestyle, and more
- **Experience Levels** - Beginner, Intermediate, Expert badges
- **Verification System** - Submit proof links for admin verification (✅ Verified, ⏳ Pending, ❓ Unverified)

### 🔍 Smart Matching
- **Auto-matching** - Finds users whose offers match your requests (and vice versa)
- **Match Actions** - Initiate, Accept, or Decline skill exchange requests
- **Match Status** - Track pending, accepted, and rejected matches
- **Complete Sessions** - Mark skill exchanges as complete

### 💬 Real-Time Chat
- **Socket.IO Messaging** - Instant message delivery
- **Typing Indicators** - See when other user is typing
- **Read Receipts** - Track message read status
- **Unread Counts** - Badge on chat list
- **Block/Unblock Users** - Control who can message you
- **Google Meet Integration** - Create video call links directly in chat

### 👤 User Profiles
- **Profile Customization** - Name, bio, location, availability
- **Skill Portfolio** - View all your offered/requested skills
- **Rating & Reviews** - Star ratings from skill exchange partners
- **Edit Skills** - Update skill details from profile

### 🔔 Live Notifications
- **Match Requests** - When someone wants to exchange skills
- **Match Accepted** - When your request is approved
- **Skill Verification** - When admin verifies your skill
- **Real-time Delivery** - Instant via Socket.IO

### 👑 Admin Dashboard
- **Stats Overview** - Total users, skills, matches, completions
- **User Management** - Ban/unban users, delete accounts
- **Skills Tab** - View and delete any user's skills
- **Skill Verification** - Approve/reject skill proof submissions
- **Search & Filters** - Find users and skills quickly

### ✨ UX Improvements
- **Contextual Buttons** - "Offer a Skill" on Offering tab, "Request a Skill" on Requesting tab
- **Empty State CTAs** - Engaging prompts when no skills exist
- **Filter Persistence** - Search/filter choices saved to localStorage
- **Success Highlighting** - "Just Posted!" banner on newly added skills
- **Clear Filters** - Quick reset button
- **Newest First** - Latest skills always appear at top

---

## 📦 Project Structure

```
skillswap/
├── client/                     # React frontend
│   ├── public/
│   └── src/
│       └── App.js              # All components in single file
├── server/                     # Node + Express backend
│   ├── middleware/
│   │   └── auth.js             # JWT middleware
│   ├── models/
│   │   ├── User.js             # User with ratings, blockedUsers
│   │   ├── Skill.js            # Skills with verification status
│   │   ├── Match.js            # Skill matches
│   │   ├── Message.js          # Chat messages
│   │   ├── Notification.js     # Notifications
│   │   └── Review.js           # User reviews
│   ├── routes/
│   │   ├── auth.js             # Login/Register
│   │   ├── skills.js           # Skill CRUD
│   │   ├── match.js            # Match actions
│   │   ├── messages.js         # Chat + Block/Unblock
│   │   ├── reviews.js          # Ratings system
│   │   ├── notifications.js    # Notifications
│   │   ├── profile.js          # User profiles
│   │   ├── admin.js            # Admin dashboard APIs
│   │   └── google.js           # Google OAuth + Meet
│   └── index.js                # Server with Socket.IO
└── README.md
```

---

## 🔐 API Authentication

Protected routes require JWT token:
```
Authorization: Bearer <your_jwt_token>
```

| Route Pattern | Auth Required |
|--------------|---------------|
| `/api/auth/*` | No |
| `/api/skills/*` | No (read), Yes (write) |
| `/api/notifications/*` | Yes |
| `/api/reviews/*` | Yes |
| `/api/admin/*` | Yes (Admin only) |

---

## 🏃 Running Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Console project (for Meet integration)

### Backend Setup
```bash
cd server
npm install

# Create .env file
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback

node index.js
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

---

## 📸 Screenshots

<img width="1920" alt="Landing Page" src="https://github.com/user-attachments/assets/b3f024bc-613f-40f3-93cb-e7b83457657d" />
<img width="1920" alt="Skill Board" src="https://github.com/user-attachments/assets/e6aee27a-0802-43e5-8228-86f9198bb6d3" />
<img width="1920" alt="Profile Page" src="https://github.com/user-attachments/assets/6dd0326f-1eea-42f6-8cb5-87285c12ceb5" />

---

## ✅ Feature Checklist

- [x] JWT authentication with sessions
- [x] User profiles with bio, location, availability
- [x] Real-time messaging via Socket.IO
- [x] Ratings and reviews for partners
- [x] Live notifications
- [x] Skill verification system
- [x] Admin dashboard with full control
- [x] Google Meet integration
- [x] Block/Unblock users
- [x] Filter persistence
- [x] Success highlighting for new skills
- [x] Mobile-responsive design

---

## 🙌 Acknowledgements

Built with ❤️ to enable peer-to-peer learning and community collaboration.
