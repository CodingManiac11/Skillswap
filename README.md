# 🔁 SkillSwap

**SkillSwap** is a full-stack web application designed to help individuals in local communities connect and exchange skills with one another — without the use of money. Whether you're offering guitar lessons and looking to learn web design, or teaching yoga while seeking cooking tips, SkillSwap matches you with the right people.

## 🌐 Live Links

https://skillswap-aadi-community.up.railway.app/

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Socket.IO Client (real-time features)

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Socket.IO (real-time messaging & notifications)
- JWT (authentication)
- bcrypt.js (password hashing)




---

## 📦 Folder Structure

```
skillswap/
├── client/                     # React frontend
│   ├── public/
│   └── src/
│       └── App.js              # Main application with all components
├── server/                     # Node + Express backend
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── models/
│   │   ├── User.js             # User model with reviews & ratings
│   │   ├── Skill.js            # Skill posts (offer/request)
│   │   ├── Match.js            # Skill matches between users
│   │   ├── Message.js          # Chat messages
│   │   └── Notification.js     # User notifications
│   ├── routes/
│   │   ├── auth.js             # Login/Register endpoints
│   │   ├── skills.js           # Skill CRUD operations
│   │   ├── match.js            # Match initiation/acceptance
│   │   ├── messages.js         # Chat messaging
│   │   ├── reviews.js          # Rating system (protected)
│   │   ├── notifications.js    # Notifications (protected)
│   │   └── profile.js          # User profile management
│   └── index.js                # Server entry with Socket.IO
└── README.md
```

---

## 🚀 Features

### Core Features
- 🔄 **Skill Posting**: Post skills you can offer and ones you want to learn
- 🔍 **Skill Matching**: Find users whose offers match your requests (and vice versa)
- ✅ **Match System**: Initiate, accept, or decline skill exchange requests
- 💬 **Real-time Chat**: Message matched users via Socket.IO
- 🔔 **Live Notifications**: Get instant alerts for match requests, acceptances, and messages

### Authentication & Security
- 🔐 **JWT Authentication**: Secure token-based auth for all protected routes
- 🔒 **Protected Endpoints**: Notifications and reviews require valid authentication
- �️ **Password Hashing**: bcrypt for secure password storage

### Rating System
- ⭐ **Match-based Reviews**: Only skill requestors can rate offerers after accepted matches
- 📊 **Aggregate Ratings**: User's `averageRating` and `ratingCount` update automatically
- 🚫 **One Review Per Match**: Prevents duplicate ratings

---

## 🔐 API Authentication

Protected routes require JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Protected Routes:**
- `/notifications/*` - All notification endpoints
- `/reviews/*` - All review endpoints

**Public Routes:**
- `/auth/register` - User registration
- `/auth/login` - User login

---

## 🏃 Running Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup
```bash
cd server
npm install
# Create .env file with MONGO_URI and JWT_SECRET
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

<img width="1920" height="1200" alt="Landing Page" src="https://github.com/user-attachments/assets/b3f024bc-613f-40f3-93cb-e7b83457657d" />
<img width="1920" height="1200" alt="Skill Board" src="https://github.com/user-attachments/assets/e6aee27a-0802-43e5-8228-86f9198bb6d3" />
<img width="1920" height="1200" alt="Profile Page" src="https://github.com/user-attachments/assets/6dd0326f-1eea-42f6-8cb5-87285c12ceb5" />

---

## ✨ Implemented Features

- ✅ JWT authentication with user sessions
- ✅ User profile pages with bio, location, availability
- ✅ Real-time messaging between matched users
- ✅ Ratings and reviews for skill partners
- ✅ Protected routes requiring authentication
- ✅ Real-time notifications via Socket.IO

---

## 🙌 Acknowledgements

This project is inspired by the idea of building community-driven platforms to enable peer-to-peer learning and collaboration.
