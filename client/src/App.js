import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';

function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-credBlack text-credWhite font-display flex flex-col items-center justify-center">
      <header className="w-full max-w-2xl mx-auto flex flex-col items-center py-12">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">SkillSwap</h1>
        <p className="text-xl mb-8 text-credAccent">Local Community Skill Exchange Platform</p>
        <div className="flex space-x-4 mb-12">
          <button onClick={() => navigate('/signup')} className="px-8 py-3 rounded-full bg-credAccent text-credBlack font-semibold text-lg shadow-lg hover:scale-105 transition-transform">Sign Up</button>
          <button onClick={() => navigate('/login')} className="px-8 py-3 rounded-full border border-credAccent text-credAccent font-semibold text-lg hover:bg-credGray hover:text-credWhite transition-colors">Log In</button>
        </div>
        <div className="flex space-x-4 mb-8">
          <button onClick={() => navigate('/skills')} className="px-6 py-2 rounded-full bg-credGray text-credWhite font-semibold text-md hover:bg-credAccent hover:text-credBlack transition-colors">Skill Board</button>
          <button onClick={() => navigate('/post-skill')} className="px-6 py-2 rounded-full bg-credGray text-credWhite font-semibold text-md hover:bg-credAccent hover:text-credBlack transition-colors">Post a Skill</button>
        </div>
        <div className="bg-credGray rounded-2xl p-8 shadow-xl w-full">
          <h2 className="text-2xl font-semibold mb-2">Why SkillSwap?</h2>
          <ul className="list-disc list-inside text-lg text-credWhite/80 space-y-1">
            <li>Offer and request skills in your community</li>
            <li>Match with others for skill exchanges</li>
            <li>Chat and build trust with reviews</li>
            <li>No money involved – just skills!</li>
          </ul>
        </div>
      </header>
      <footer className="mt-auto py-4 text-credWhite/60 text-sm">SkillSwap © 2025</footer>
    </div>
  );
}

function SignUp() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">
      <div className="bg-credGray p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-credWhite/80">Name</label>
            <input name="name" type="text" required value={form.name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent" />
          </div>
          <div>
            <label className="block mb-1 text-credWhite/80">Email</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent" />
          </div>
          <div>
            <label className="block mb-1 text-credWhite/80">Password</label>
            <input name="password" type="password" required value={form.password} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent" />
          </div>
          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          <button type="submit" className="w-full py-3 rounded-full bg-credAccent text-credBlack font-semibold text-lg shadow-lg hover:scale-105 transition-transform" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
        </form>
        <div className="text-center mt-4 text-credWhite/70">
          Already have an account?{' '}
          <Link to="/login" className="text-credAccent hover:underline">Log In</Link>
        </div>
      </div>
    </div>
  );
}

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      navigate('/skills');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">
      <div className="bg-credGray p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center">Log In</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-credWhite/80">Email</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent" />
          </div>
          <div>
            <label className="block mb-1 text-credWhite/80">Password</label>
            <input name="password" type="password" required value={form.password} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent" />
          </div>
          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          <button type="submit" className="w-full py-3 rounded-full bg-credAccent text-credBlack font-semibold text-lg shadow-lg hover:scale-105 transition-transform" disabled={loading}>{loading ? 'Logging In...' : 'Log In'}</button>
        </form>
        <div className="text-center mt-4 text-credWhite/70">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-credAccent hover:underline">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

function SkillPostForm() {
  const [form, setForm] = useState({ type: 'offer', skillName: '', description: '', availability: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // For demo, get userId from localStorage (in real app, use auth context)
  const userId = localStorage.getItem('userId') || 'demo-user-id';

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to post skill');
      setSuccess('Skill posted successfully!');
      setTimeout(() => navigate('/skills'), 1000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">
      <div className="bg-credGray p-8 rounded-2xl shadow-xl w-full max-w-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">Post a Skill</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input type="radio" name="type" value="offer" checked={form.type === 'offer'} onChange={handleChange} className="mr-2" /> Offer
            </label>
            <label className="flex items-center">
              <input type="radio" name="type" value="request" checked={form.type === 'request'} onChange={handleChange} className="mr-2" /> Request
            </label>
          </div>
          <div>
            <label className="block mb-1 text-credWhite/80">Skill Name</label>
            <input name="skillName" type="text" required value={form.skillName} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent" />
          </div>
          <div>
            <label className="block mb-1 text-credWhite/80">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent" />
          </div>
          <div>
            <label className="block mb-1 text-credWhite/80">Availability</label>
            <input name="availability" type="text" value={form.availability} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent" placeholder="e.g. Weekends, Evenings" />
          </div>
          <div>
            <label className="block mb-1 text-credWhite/80">Location</label>
            <input name="location" type="text" value={form.location} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent" />
          </div>
          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          {success && <div className="text-green-400 text-sm text-center">{success}</div>}
          <button type="submit" className="w-full py-3 rounded-full bg-credAccent text-credBlack font-semibold text-lg shadow-lg hover:scale-105 transition-transform" disabled={loading}>{loading ? 'Posting...' : 'Post Skill'}</button>
        </form>
        <div className="text-center mt-4 text-credWhite/70">
          <Link to="/skills" className="text-credAccent hover:underline">Back to Skill Board</Link>
        </div>
      </div>
    </div>
  );
}

function MatchSuggestions() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId') || 'demo-user-id';
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/users/matches/${userId}`)
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        setLoading(false);
      });
  }, [userId]);

  return (
    <div className="min-h-screen bg-credBlack text-credWhite font-display flex flex-col items-center py-8">
      <div className="w-full max-w-3xl">
        <h2 className="text-3xl font-bold mb-6 text-center">Your Skill Matches</h2>
        {loading ? (
          <div className="text-center text-credWhite/60">Loading...</div>
        ) : matches.length === 0 ? (
          <div className="text-center text-credWhite/60">No matches found. Try posting or requesting more skills!</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {matches.map(skill => (
              <div key={skill._id} className="bg-credGray rounded-xl p-6 shadow-lg flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide" style={{ background: skill.type === 'offer' ? '#2ed573' : '#232326', color: skill.type === 'offer' ? '#18181a' : '#f7f7fa' }}>{skill.type}</span>
                  <span className="text-sm text-credWhite/60">{skill.timestamp && new Date(skill.timestamp).toLocaleString()}</span>
                </div>
                <h3 className="text-xl font-bold">{skill.skillName}</h3>
                <p className="text-credWhite/80">{skill.description}</p>
                <div className="flex space-x-4 text-credWhite/70 text-sm">
                  <span>By: {skill.userId?.name || 'User'}</span>
                  <span>Location: {skill.location || 'N/A'}</span>
                  <span>Availability: {skill.availability || 'N/A'}</span>
                </div>
                <button onClick={() => navigate('/chat', { state: { otherUserId: skill.userId?._id, otherUserName: skill.userId?.name } })} className="mt-2 px-4 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform">Message</button>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-6">
          <Link to="/skills" className="text-credAccent hover:underline">Back to Skill Board</Link>
        </div>
      </div>
    </div>
  );
}

function SkillBoard() {
  const [skills, setSkills] = useState([]);
  const [tab, setTab] = useState('offer');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/skills')
      .then(res => res.json())
      .then(data => setSkills(data));
  }, []);

  const filtered = skills.filter(skill =>
    skill.type === tab &&
    (!search || skill.skillName.toLowerCase().includes(search.toLowerCase())) &&
    (!location || (skill.location || '').toLowerCase().includes(location.toLowerCase())) &&
    (!availability || (skill.availability || '').toLowerCase().includes(availability.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-credBlack text-credWhite font-display flex flex-col items-center py-8">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <button onClick={() => setTab('offer')} className={`px-6 py-2 rounded-full font-semibold ${tab === 'offer' ? 'bg-credAccent text-credBlack' : 'bg-credGray text-credWhite'} transition-colors`}>Offering</button>
            <button onClick={() => setTab('request')} className={`px-6 py-2 rounded-full font-semibold ${tab === 'request' ? 'bg-credAccent text-credBlack' : 'bg-credGray text-credWhite'} transition-colors`}>Requesting</button>
          </div>
          <div className="flex space-x-2">
            <Link to="/post-skill" className="px-6 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform">Post a Skill</Link>
            <Link to="/matches" className="px-6 py-2 rounded-full bg-credGray text-credWhite font-semibold hover:bg-credAccent hover:text-credBlack transition-colors">Your Matches</Link>
          </div>
        </div>
        <div className="flex space-x-4 mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skill..." className="px-4 py-2 rounded-lg bg-credGray text-credWhite border border-credAccent focus:outline-none w-1/3" />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="px-4 py-2 rounded-lg bg-credGray text-credWhite border border-credAccent focus:outline-none w-1/3" />
          <input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Availability" className="px-4 py-2 rounded-lg bg-credGray text-credWhite border border-credAccent focus:outline-none w-1/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.length === 0 && <div className="col-span-2 text-center text-credWhite/60">No skills found.</div>}
          {filtered.map(skill => (
            <div key={skill._id} className="bg-credGray rounded-xl p-6 shadow-lg flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide" style={{ background: skill.type === 'offer' ? '#2ed573' : '#232326', color: skill.type === 'offer' ? '#18181a' : '#f7f7fa' }}>{skill.type}</span>
                <span className="text-sm text-credWhite/60">{skill.timestamp && new Date(skill.timestamp).toLocaleString()}</span>
              </div>
              <h3 className="text-xl font-bold">{skill.skillName}</h3>
              <p className="text-credWhite/80">{skill.description}</p>
              <div className="flex space-x-4 text-credWhite/70 text-sm">
                <span>By: {skill.userId?.name || 'User'}</span>
                <span>Location: {skill.location || 'N/A'}</span>
                <span>Availability: {skill.availability || 'N/A'}</span>
              </div>
              <button onClick={() => navigate('/chat', { state: { otherUserId: skill.userId?._id, otherUserName: skill.userId?.name } })} className="mt-2 px-4 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform">Message</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chat() {
  const location = useLocation();
  const { otherUserId, otherUserName } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId') || 'demo-user-id';

  useEffect(() => {
    if (!otherUserId) return;
    fetch(`/messages/${userId}/${otherUserId}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
      });
  }, [userId, otherUserId]);

  const sendMessage = async e => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = { senderId: userId, receiverId: otherUserId, message: input };
    const res = await fetch('/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    if (res.ok) {
      setMessages([...messages, { ...msg, timestamp: new Date() }]);
      setInput('');
    }
  };

  if (!otherUserId) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">No user selected.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-credBlack text-credWhite font-display py-8">
      <div className="w-full max-w-xl bg-credGray rounded-2xl shadow-xl p-6 flex flex-col h-[70vh]">
        <h2 className="text-2xl font-bold mb-4 text-center">Chat with {otherUserName || 'User'}</h2>
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {loading ? <div className="text-center text-credWhite/60">Loading...</div> :
            messages.length === 0 ? <div className="text-center text-credWhite/60">No messages yet.</div> :
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2 rounded-lg ${msg.senderId === userId ? 'bg-credAccent text-credBlack' : 'bg-credGray text-credWhite border border-credAccent'}`}>{msg.message}</div>
                </div>
              ))
          }
        </div>
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent" placeholder="Type a message..." />
          <button type="submit" className="px-6 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform">Send</button>
        </form>
      </div>
      <div className="text-center mt-6">
        <Link to="/skills" className="text-credAccent hover:underline">Back to Skill Board</Link>
      </div>
    </div>
  );
}

function ChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    fetch(`/messages/${userId}/all`)
      .then(res => res.json())
      .then(data => {
        setConversations(data);
        setLoading(false);
      });
  }, [userId]);

  if (!userId) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Please log in.</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Loading...</div>;

  return (
    <div className="min-h-screen bg-credBlack text-credWhite font-display flex flex-col items-center py-8">
      <div className="w-full max-w-2xl bg-credGray rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">Your Chats</h2>
        {Array.isArray(conversations) && conversations.length === 0 ? (
          <div className="text-center text-credWhite/60">No conversations yet.</div>
        ) : (
          <ul className="space-y-4">
            {(Array.isArray(conversations) ? conversations : []).map(conv => (
              <li key={conv.otherUserId} className="flex justify-between items-center bg-credBlack rounded-lg p-4">
                <div>
                  <div className="font-bold">{conv.otherUserName || 'User'}</div>
                  <div className="text-credWhite/70 text-sm">Last: {conv.lastMessage || 'No messages yet.'}</div>
                </div>
                <button onClick={() => navigate('/chat', { state: { otherUserId: conv.otherUserId, otherUserName: conv.otherUserName } })} className="px-4 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform">Open Chat</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  useEffect(() => {
    if (!userId) return;
    fetch(`/profile/${userId}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      });
  }, [userId]);
  if (!userId) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Please log in.</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Loading...</div>;
  return (
    <div className="min-h-screen bg-credBlack text-credWhite font-display flex flex-col items-center py-8">
      <div className="w-full max-w-2xl bg-credGray rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-4 text-center">Your Profile</h2>
        <div className="mb-4">
          <div className="font-bold text-lg">{profile.name}</div>
          <div className="text-credWhite/70">{profile.email}</div>
          <div className="text-credWhite/70">{profile.location}</div>
          <div className="text-credWhite/70">{profile.bio}</div>
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-2">Skills Offered</div>
          <ul className="list-disc list-inside text-credWhite/80">
            {profile.skillsOffered && profile.skillsOffered.length > 0 ? profile.skillsOffered.map(skill => <li key={skill._id}>{skill.skillName}</li>) : <li>None</li>}
          </ul>
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-2">Skills Requested</div>
          <ul className="list-disc list-inside text-credWhite/80">
            {profile.skillsRequested && profile.skillsRequested.length > 0 ? profile.skillsRequested.map(skill => <li key={skill._id}>{skill.skillName}</li>) : <li>None</li>}
          </ul>
        </div>
        <ReviewSection userId={userId} />
      </div>
    </div>
  );
}

function ReviewSection({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/reviews/${userId}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      });
  }, [userId]);
  if (loading) return <div>Loading reviews...</div>;
  const avg = reviews.length ? (reviews.reduce((a, b) => a + (b.rating || 0), 0) / reviews.length).toFixed(1) : null;
  return (
    <div className="mt-6">
      <div className="font-semibold mb-2">Reviews {avg && <span className="ml-2 text-credAccent">★ {avg}</span>}</div>
      <ul className="space-y-2">
        {reviews.length === 0 ? <li className="text-credWhite/60">No reviews yet.</li> :
          reviews.map((r, i) => <li key={i} className="bg-credBlack rounded-lg p-3"><span className="font-bold">{r.reviewerId?.name || 'User'}:</span> <span className="text-credAccent">{r.rating}★</span> {r.comment}</li>)}
      </ul>
      <LeaveReview userId={userId} />
    </div>
  );
}

function LeaveReview({ userId }) {
  const [form, setForm] = useState({ rating: '', comment: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const reviewerId = localStorage.getItem('userId');
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess(''); setError('');
    try {
      const res = await fetch(`/reviews/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId, ...form }),
      });
      if (!res.ok) throw new Error('Failed to post review');
      setSuccess('Review posted!');
      setForm({ rating: '', comment: '' });
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <label>Rating:</label>
        <select name="rating" value={form.rating} onChange={handleChange} className="rounded px-2 py-1 bg-credBlack text-credWhite border border-credGray">
          <option value="">Select</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <textarea name="comment" value={form.comment} onChange={handleChange} placeholder="Write a review..." className="rounded px-2 py-1 bg-credBlack text-credWhite border border-credGray" />
      <button type="submit" className="px-4 py-2 rounded-full bg-credAccent text-credBlack font-semibold">Submit Review</button>
      {success && <div className="text-green-400 text-sm text-center">{success}</div>}
      {error && <div className="text-red-400 text-sm text-center">{error}</div>}
    </form>
  );
}

function ProtectedRoute({ children }) {
  const userId = localStorage.getItem('userId');
  if (!userId) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Please log in to access this page.</div>;
  return children;
}

function MainNav() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  if (!userId) return null;
  return (
    <nav className="w-full flex justify-center space-x-6 py-4 bg-credGray text-credWhite font-display">
      <button onClick={() => navigate('/skills')} className="hover:text-credAccent">Skill Board</button>
      <button onClick={() => navigate('/post-skill')} className="hover:text-credAccent">Post Skill</button>
      <button onClick={() => navigate('/matches')} className="hover:text-credAccent">Matches</button>
      <button onClick={() => navigate('/chats')} className="hover:text-credAccent">Chats</button>
      <button onClick={() => navigate('/profile')} className="hover:text-credAccent">Profile</button>
      <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="hover:text-credAccent">Logout</button>
    </nav>
  );
}

function App() {
  return (
    <>
      <MainNav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/post-skill" element={<ProtectedRoute><SkillPostForm /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><SkillBoard /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><MatchSuggestions /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chats" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;
