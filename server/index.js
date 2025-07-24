const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = 'mongodb+srv://adityautsav1901:M8WLtVD3zgae7UZs@cluster0.zfgor4s.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const skillsRoutes = require('./routes/skills');
app.use('/skills', skillsRoutes);

const matchRoutes = require('./routes/match');
app.use('/users/matches', matchRoutes);

const messagesRoutes = require('./routes/messages');
app.use('/messages', messagesRoutes);

const reviewsRoutes = require('./routes/reviews');
app.use('/reviews', reviewsRoutes);
const profileRoutes = require('./routes/profile');
app.use('/profile', profileRoutes);

app.get('/', (req, res) => {
  res.send('SkillSwap API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 