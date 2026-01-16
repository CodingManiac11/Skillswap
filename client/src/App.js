import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-credBlack text-credWhite font-display flex flex-col items-center justify-center px-4">
      <header className="w-full max-w-2xl mx-auto flex flex-col items-center py-8 sm:py-12">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight text-center">SkillSwap</h1>
        <p className="text-lg sm:text-xl mb-8 text-credAccent text-center">Local Community Skill Exchange Platform</p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-8 sm:mb-12 w-full sm:w-auto">
          <button onClick={() => navigate('/signup')} className="px-6 sm:px-8 py-3 rounded-full bg-credAccent text-credBlack font-semibold text-base sm:text-lg shadow-lg hover:scale-105 transition-transform">Sign Up</button>
          <button onClick={() => navigate('/login')} className="px-6 sm:px-8 py-3 rounded-full border border-credAccent text-credAccent font-semibold text-base sm:text-lg hover:bg-credGray hover:text-credWhite transition-colors">Log In</button>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-8 w-full sm:w-auto">
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

    // Validate Gmail only
    if (!form.email.toLowerCase().endsWith('@gmail.com')) {
      setError('Only Gmail addresses are allowed. Please use a @gmail.com email.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
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
      const res = await fetch('/api/auth/login', {
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
      const res = await fetch('/api/skills', {
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
  const [actionLoading, setActionLoading] = useState({});
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  const fetchMatches = async () => {
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/users/matches/${userId}?t=${timestamp}`);
      const data = await res.json();
      console.log('Fetched matches:', data);
      setMatches(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleMatchAction = async (idOrMatchId, action) => {
    console.log('Match action:', { idOrMatchId, action, userId });
    setActionLoading(prev => ({ ...prev, [idOrMatchId]: true }));

    try {
      // For accept/decline, idOrMatchId is the matchId; for initiate, it's skillId
      const requestBody = { userId, action };
      if (action === 'accept' || action === 'decline') {
        requestBody.matchId = idOrMatchId;
      } else {
        requestBody.skillId = idOrMatchId;
      }

      const res = await fetch('/api/users/matches/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await res.json();
      console.log('Match action result:', result);

      if (res.ok) {
        await fetchMatches();
        alert(result.message || 'Action completed successfully');
      } else {
        alert(result.message || 'Failed to process action');
      }
    } catch (err) {
      console.error('Error managing match:', err);
      alert('Failed to process action');
    }

    setActionLoading(prev => ({ ...prev, [idOrMatchId]: false }));
  };

  const getMatchStatusBadge = (status) => {
    const styles = {
      none: { bg: '#3b82f6', color: '#ffffff', text: 'Available' },
      pending: { bg: '#f59e0b', color: '#000000', text: 'Pending' },
      accepted: { bg: '#22c55e', color: '#000000', text: 'Matched' },
      declined: { bg: '#ef4444', color: '#ffffff', text: 'Declined' }
    };
    const style = styles[status] || styles.none;
    return (
      <span className="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ml-2"
        style={{ background: style.bg, color: style.color }}>
        {style.text}
      </span>
    );
  };

  // Separate matches by category
  const incomingRequests = matches.filter(m => m.actionRequired === 'approve' && m.canTakeAction);
  const outgoingRequests = matches.filter(m => m.actionRequired === 'waiting');
  const acceptedMatches = matches.filter(m => m.matchStatus === 'accepted');
  const availableMatches = matches.filter(m =>
    (m.actionRequired === 'request_match' || m.actionRequired === 'offer_to_help') && m.canTakeAction
  );

  if (!userId) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Please log in.</div>;

  const MatchCard = ({ skill, showActions = true }) => (
    <div className="bg-credGray rounded-xl p-5 shadow-lg flex flex-col space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${skill.type === 'offer' ? 'bg-green-500 text-black' : 'bg-blue-500 text-white'
            }`}>
            {skill.type === 'offer' ? '🎓 Offering' : '📚 Requesting'}
          </span>
          {getMatchStatusBadge(skill.matchStatus)}
        </div>
        <span className="text-xs text-credWhite/50">{skill.timestamp && new Date(skill.timestamp).toLocaleDateString()}</span>
      </div>

      <h3 className="text-xl font-bold text-credAccent">{skill.skillName}</h3>
      {skill.description && <p className="text-credWhite/70 text-sm">{skill.description}</p>}

      <div className="flex flex-wrap gap-3 text-credWhite/60 text-sm">
        <span className="flex items-center gap-1">
          <span>👤</span> {skill.userId?.name || 'User'}
        </span>
        {skill.location && (
          <span className="flex items-center gap-1">
            <span>📍</span> {skill.location}
          </span>
        )}
      </div>

      {/* Show role context */}
      <div className="text-xs text-credWhite/40 italic">
        {skill.isUserRequester && skill.type === 'offer' && 'You requested this skill - they can teach you'}
        {skill.isUserOfferer && skill.type === 'request' && 'You offer this skill - they need it'}
        {skill.actionRequired === 'approve' && skill.canTakeAction && (
          skill.type === 'offer'
            ? '💡 They offered to help you!'
            : '💡 They want to learn from you!'
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Request/Offer buttons for available matches */}
          {skill.actionRequired === 'request_match' && skill.canTakeAction && (
            <button
              onClick={() => handleMatchAction(skill._id, 'initiate')}
              disabled={actionLoading[skill._id]}
              className="px-4 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform disabled:opacity-50"
            >
              {actionLoading[skill._id] ? 'Sending...' : '🙋 Request to Learn'}
            </button>
          )}

          {skill.actionRequired === 'offer_to_help' && skill.canTakeAction && (
            <button
              onClick={() => handleMatchAction(skill._id, 'initiate')}
              disabled={actionLoading[skill._id]}
              className="px-4 py-2 rounded-full bg-green-500 text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50"
            >
              {actionLoading[skill._id] ? 'Sending...' : '✋ Offer to Help'}
            </button>
          )}

          {/* Accept/Decline for incoming requests */}
          {skill.actionRequired === 'approve' && skill.canTakeAction && (
            <>
              <button
                onClick={() => handleMatchAction(skill.matchId || skill._id, 'accept')}
                disabled={actionLoading[skill._id]}
                className="px-4 py-2 rounded-full bg-green-600 text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50"
              >
                {actionLoading[skill._id] ? '...' : '✓ Accept'}
              </button>
              <button
                onClick={() => handleMatchAction(skill.matchId || skill._id, 'decline')}
                disabled={actionLoading[skill._id]}
                className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50"
              >
                {actionLoading[skill._id] ? '...' : '✗ Decline'}
              </button>
            </>
          )}

          {/* Waiting status */}
          {skill.actionRequired === 'waiting' && (
            <div className="px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-300 font-medium border border-yellow-500/30">
              ⏳ Waiting for response...
            </div>
          )}

          {/* Chat button for accepted matches */}
          {skill.matchStatus === 'accepted' && (
            <button
              onClick={() => navigate('/chat', { state: { otherUserId: skill.userId?._id, otherUserName: skill.userId?.name } })}
              className="px-4 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform"
            >
              💬 Start Chatting
            </button>
          )}

          {/* Declined - can try again */}
          {skill.matchStatus === 'declined' && (
            <div className="px-4 py-2 rounded-full bg-red-500/20 text-red-300 font-medium border border-red-500/30">
              Request was declined
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-credBlack text-credWhite font-display py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Skill Matches</h1>

        {loading ? (
          <div className="text-center text-credWhite/60 py-12">
            <div className="animate-spin w-8 h-8 border-2 border-credAccent border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading matches...
          </div>
        ) : (
          <>
            {/* Incoming Requests - Need your approval */}
            {incomingRequests.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="bg-green-500 text-black px-3 py-1 rounded-full text-sm">{incomingRequests.length}</span>
                  Needs Your Response
                  <span className="text-sm font-normal text-credWhite/60">- Accept or decline these requests</span>
                </h2>
                <div className="grid gap-4">
                  {incomingRequests.map(skill => <MatchCard key={skill._id} skill={skill} />)}
                </div>
              </section>
            )}

            {/* Outgoing Requests - Waiting for response */}
            {outgoingRequests.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm">{outgoingRequests.length}</span>
                  Your Pending Requests
                  <span className="text-sm font-normal text-credWhite/60">- Waiting for the other party to respond</span>
                </h2>
                <div className="grid gap-4">
                  {outgoingRequests.map(skill => <MatchCard key={skill._id} skill={skill} />)}
                </div>
              </section>
            )}

            {/* Accepted Matches - Can chat */}
            {acceptedMatches.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="bg-credAccent text-black px-3 py-1 rounded-full text-sm">{acceptedMatches.length}</span>
                  Active Matches
                  <span className="text-sm font-normal text-credWhite/60">- Chat now!</span>
                </h2>
                <div className="grid gap-4">
                  {acceptedMatches.map(skill => <MatchCard key={skill._id} skill={skill} />)}
                </div>
              </section>
            )}

            {/* Available Matches - Can initiate */}
            {availableMatches.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">{availableMatches.length}</span>
                  Available Matches
                  <span className="text-sm font-normal text-credWhite/60">- Skills matching yours</span>
                </h2>
                <div className="grid gap-4">
                  {availableMatches.map(skill => <MatchCard key={skill._id} skill={skill} />)}
                </div>
              </section>
            )}

            {/* No matches at all */}
            {matches.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2">No matches found</h3>
                <p className="text-credWhite/60 mb-6">Post skills you can offer or request skills you need!</p>
                <Link to="/post-skill" className="px-6 py-3 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform inline-block">
                  Post a Skill
                </Link>
              </div>
            )}
          </>
        )}

        <div className="text-center mt-8">
          <Link to="/skills" className="text-credAccent hover:underline">← Back to Skill Board</Link>
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
  const [deleteLoading, setDeleteLoading] = useState({});
  // const navigate = useNavigate(); // Removed - unused
  const currentUserId = localStorage.getItem('userId');

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      setSkills(data);
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleDeleteSkill = async (skillId) => {
    if (!currentUserId) {
      alert('Please log in to delete skills');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(prev => ({ ...prev, [skillId]: true }));

    try {
      console.log('Deleting skill:', { skillId, userId: currentUserId });

      const res = await fetch(`/api/skills/${skillId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      const result = await res.json();
      console.log('Delete response:', { status: res.status, result });

      if (res.ok) {
        // Refresh skills list
        await fetchSkills();
        alert('Skill deleted successfully');
      } else {
        console.error('Delete failed:', result);
        alert(result.message || 'Failed to delete skill');
      }
    } catch (err) {
      console.error('Error deleting skill:', err);
      alert('Failed to delete skill: ' + err.message);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [skillId]: false }));
    }
  };

  const filtered = skills.filter(skill =>
    skill.type === tab &&
    (!search || skill.skillName.toLowerCase().includes(search.toLowerCase())) &&
    (!location || (skill.location || '').toLowerCase().includes(location.toLowerCase())) &&
    (!availability || (skill.availability || '').toLowerCase().includes(availability.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-credBlack text-credWhite font-display flex flex-col items-center py-4 sm:py-8 px-4">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex space-x-2">
            <button onClick={() => setTab('offer')} className={`px-4 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-base ${tab === 'offer' ? 'bg-credAccent text-credBlack' : 'bg-credGray text-credWhite'} transition-colors`}>Offering</button>
            <button onClick={() => setTab('request')} className={`px-4 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-base ${tab === 'request' ? 'bg-credAccent text-credBlack' : 'bg-credGray text-credWhite'} transition-colors`}>Requesting</button>
          </div>
          <div className="flex space-x-2">
            <Link to="/post-skill" className="px-4 sm:px-6 py-2 rounded-full bg-credAccent text-credBlack font-semibold text-sm sm:text-base hover:scale-105 transition-transform">Post a Skill</Link>
            <Link to="/matches" className="px-4 sm:px-6 py-2 rounded-full bg-credGray text-credWhite font-semibold text-sm sm:text-base hover:bg-credAccent hover:text-credBlack transition-colors">Your Matches</Link>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skill..." className="px-4 py-2 rounded-lg bg-credGray text-credWhite border border-credAccent focus:outline-none w-full sm:w-1/3" />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="px-4 py-2 rounded-lg bg-credGray text-credWhite border border-credAccent focus:outline-none w-full sm:w-1/3" />
          <input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Availability" className="px-4 py-2 rounded-lg bg-credGray text-credWhite border border-credAccent focus:outline-none w-full sm:w-1/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filtered.length === 0 && <div className="col-span-2 text-center text-credWhite/60">No skills found.</div>}
          {filtered.map(skill => (
            <div key={skill._id} className="bg-credGray rounded-xl p-6 shadow-lg flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide" style={{ background: skill.type === 'offer' ? '#2ed573' : '#232326', color: skill.type === 'offer' ? '#18181a' : '#f7f7fa' }}>{skill.type}</span>
                <span className="text-sm text-credWhite/60">{skill.timestamp && new Date(skill.timestamp).toLocaleString()}</span>
              </div>
              <h3 className="text-xl font-bold">{skill.skillName}</h3>
              <p className="text-credWhite/80">{skill.description}</p>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-credWhite/70 text-sm">
                <span>By: {skill.userId?.name || 'User'}</span>
                <span>Location: {skill.location || 'N/A'}</span>
                <span>Availability: {skill.availability || 'N/A'}</span>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2 mt-4">
                {/* Delete button - only show for current user's skills */}
                {skill.userId?._id === currentUserId && (
                  <button
                    onClick={() => handleDeleteSkill(skill._id)}
                    disabled={deleteLoading[skill._id]}
                    className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {deleteLoading[skill._id] ? 'Deleting...' : 'Delete Skill'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Socket.IO connection singleton
let socket = null;
const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : 'http://localhost:5000';

const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
  }
  return socket;
};

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { otherUserId, otherUserName } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false); // Track if other user is online
  const userId = localStorage.getItem('userId');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Google Meet state
  const [googleConnected, setGoogleConnected] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  // Backend URL for API calls (same as socket)
  const API_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

  // Check if Google is connected
  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/api/google/status/${userId}`)
      .then(res => res.json())
      .then(data => setGoogleConnected(data.connected))
      .catch(() => setGoogleConnected(false));
  }, [userId, API_URL]);

  // Create Google Meet link
  const createMeeting = async () => {
    if (!googleConnected) {
      // Redirect to Google OAuth on backend
      window.location.href = `${API_URL}/api/google/auth/${userId}`;
      return;
    }

    setCreatingMeeting(true);
    try {
      const res = await fetch(`${API_URL}/api/google/create-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          otherUserName,
          title: `SkillSwap Session with ${otherUserName}`
        })
      });

      const data = await res.json();

      if (res.ok && data.meetLink) {
        // Send meeting link as a message
        const meetMessage = `📹 Join our SkillSwap session: ${data.meetLink}`;
        if (socketRef.current?.connected) {
          socketRef.current.emit('send_message', {
            senderId: userId,
            receiverId: otherUserId,
            message: meetMessage
          });
        }
      } else if (data.authUrl) {
        // Need to re-authenticate
        window.location.href = `${API_URL}${data.authUrl}`;
      } else {
        setError(data.error || 'Failed to create meeting');
      }
    } catch (err) {
      setError('Failed to create meeting');
    }
    setCreatingMeeting(false);
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!otherUserId || !userId) return;

    socketRef.current = getSocket();
    const socket = socketRef.current;

    // Connect and join chat room
    socket.on('connect', () => {
      console.log('🔌 Connected to server');
      setConnected(true);
      socket.emit('user_online', userId);
      socket.emit('join_chat', { userId, otherUserId });
    });

    // If already connected, join room immediately
    if (socket.connected) {
      setConnected(true);
      socket.emit('user_online', userId);
      socket.emit('join_chat', { userId, otherUserId });
    }

    // Listen for incoming messages
    socket.on('receive_message', (newMessage) => {
      console.log('📨 Received message:', newMessage);
      setMessages(prev => {
        // Prevent duplicates
        const exists = prev.some(m => m._id === newMessage._id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    });

    // Listen for typing indicator
    socket.on('user_typing', ({ userId: typingUserId, isTyping: typing }) => {
      if (typingUserId === otherUserId) {
        setIsTyping(typing);
      }
    });

    // Handle connection errors
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnected(false);
    });

    // Listen for other user joining/leaving chat
    socket.on('user_joined_chat', ({ oderId }) => {
      if (oderId === otherUserId) {
        setOtherUserOnline(true);
      }
    });

    socket.on('user_left_chat', ({ oderId }) => {
      if (oderId === otherUserId) {
        setOtherUserOnline(false);
      }
    });

    // Check if other user is already in chat
    socket.emit('check_user_in_chat', { otherUserId }, (isInChat) => {
      setOtherUserOnline(isInChat);
    });

    // Mark messages from other user as read when opening chat
    fetch(`/api/messages/mark-read/${userId}/${otherUserId}`, { method: 'POST' })
      .catch(err => console.log('Could not mark messages as read:', err));

    // Fetch existing messages
    fetch(`/api/messages/${userId}/${otherUserId}`)
      .then(res => res.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
        setLoading(false);
      });

    // Cleanup on unmount
    return () => {
      socket.emit('leave_chat', { userId, otherUserId });
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('user_joined_chat');
      socket.off('user_left_chat');
    };
  }, [userId, otherUserId]);

  // Send message via Socket.IO
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msgData = { senderId: userId, receiverId: otherUserId, message: input };

    // Emit via socket for real-time delivery
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', msgData);
      setInput('');
      setError('');
    } else {
      // Fallback to HTTP if socket is disconnected
      try {
        const res = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgData),
        });
        if (res.ok) {
          const result = await res.json();
          setMessages(prev => [...prev, { ...msgData, timestamp: new Date(), _id: result.data?._id }]);
          setInput('');
          setError('');
        } else {
          setError('Failed to send message');
        }
      } catch (err) {
        setError('Failed to send message');
      }
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setInput(e.target.value);
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { userId, otherUserId, isTyping: e.target.value.length > 0 });
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!otherUserId) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">No user selected.</div>;
  if (!userId) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Please log in.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-credBlack text-credWhite font-display py-2 sm:py-4 px-2 sm:px-4">
      <div className="w-full max-w-xl bg-credGray rounded-xl sm:rounded-2xl shadow-xl flex flex-col h-[85vh] sm:h-[80vh]">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-credBlack/30">
          <button onClick={() => navigate('/chats')} className="text-credAccent hover:text-credWhite transition-colors">
            ← Back
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold">{otherUserName || 'User'}</h2>
            <div className="text-xs text-credWhite/60">
              {!connected ? (
                <span className="text-yellow-400">Connecting...</span>
              ) : otherUserOnline ? (
                <span className="text-green-400">● Online</span>
              ) : (
                <span className="text-credWhite/40">○ Offline</span>
              )}
            </div>
          </div>
          <button
            onClick={createMeeting}
            disabled={creatingMeeting}
            className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-1"
            title={googleConnected ? 'Create Google Meet' : 'Connect Google to create meetings'}
          >
            {creatingMeeting ? '...' : '📹'}
            <span className="hidden sm:inline">{googleConnected ? 'Meet' : 'Connect'}</span>
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#1a1a1d' }}>
          {error && <div className="text-red-400 text-center text-sm bg-red-900/20 p-2 rounded">{error}</div>}
          {loading ? (
            <div className="text-center text-credWhite/60 py-8">
              <div className="animate-spin w-8 h-8 border-2 border-credAccent border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-credWhite/60 py-8">
              <div className="text-4xl mb-2">👋</div>
              No messages yet. Say hello!
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg._id || i}
                className={msg.isSystemMessage ? 'flex justify-center' : `flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
              >
                {msg.isSystemMessage ? (
                  <div className="px-4 py-2 rounded-lg bg-yellow-600/20 text-yellow-200 border border-yellow-600/30 text-center text-sm italic max-w-[80%]">
                    {msg.message}
                  </div>
                ) : (
                  <div className={`max-w-[75%] ${msg.senderId === userId ? 'order-1' : 'order-2'}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${msg.senderId === userId
                        ? 'bg-credAccent text-credBlack rounded-br-sm'
                        : 'bg-credGray text-credWhite border border-credAccent/30 rounded-bl-sm'
                        }`}
                    >
                      <p className="break-words">
                        {msg.message.includes('meet.google.com') ? (
                          <>
                            {msg.message.split(/(https:\/\/meet\.google\.com\/[a-z-]+)/gi).map((part, idx) =>
                              part.match(/https:\/\/meet\.google\.com\/[a-z-]+/i) ? (
                                <a
                                  key={idx}
                                  href={part}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1 mt-1 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                                >
                                  📹 Join Meeting
                                </a>
                              ) : (
                                <span key={idx}>{part}</span>
                              )
                            )}
                          </>
                        ) : msg.message}
                      </p>
                    </div>
                    <div className={`text-xs text-credWhite/40 mt-1 ${msg.senderId === userId ? 'text-right' : 'text-left'}`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-credGray text-credWhite/60 px-4 py-2 rounded-2xl rounded-bl-sm border border-credAccent/30">
                <div className="flex space-x-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="flex items-center p-4 border-t border-credBlack/30 gap-2">
          <input
            value={input}
            onChange={handleTyping}
            className="flex-1 px-4 py-3 rounded-full bg-credBlack text-credWhite border border-credGray/50 focus:outline-none focus:ring-2 focus:ring-credAccent focus:border-transparent"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}


function ChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    console.log('Fetching conversations for user:', userId); // Debug log

    fetch(`/api/messages/${userId}/all`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Received conversations:', data); // Debug log
        setConversations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations');
        setLoading(false);
      });
  }, [userId]);

  if (!userId) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Please log in.</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Loading...</div>;

  return (
    <div className="min-h-screen bg-credBlack text-credWhite font-display flex flex-col items-center py-4 sm:py-8 px-4">
      <div className="w-full max-w-2xl bg-credGray rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Your Chats</h2>
        {error && <div className="text-red-400 text-center text-sm mb-4">{error}</div>}
        {Array.isArray(conversations) && conversations.length === 0 ? (
          <div className="text-center text-credWhite/60">No conversations yet.</div>
        ) : (
          <ul className="space-y-4">
            {(Array.isArray(conversations) ? conversations : []).map(conv => (
              <li key={conv.otherUserId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 bg-credBlack rounded-lg p-4">
                <div className="flex-1">
                  <div className="font-bold flex items-center gap-2">
                    {conv.otherUserName || 'User'}
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold min-w-[20px] text-center">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                    {conv.skillName && (
                      <span className="px-2 py-1 rounded-full bg-credAccent text-credBlack text-xs">
                        {conv.skillName}
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${conv.isSystemMessage ? 'text-yellow-200 italic' : 'text-credWhite/70'} line-clamp-1`}>
                    {conv.lastMessage
                      ? (conv.lastMessage.length > 50
                        ? conv.lastMessage.substring(0, 50) + '...'
                        : conv.lastMessage)
                      : 'No messages yet.'}
                  </div>
                  <div className="text-xs text-credWhite/50">
                    {conv.lastTimestamp && new Date(conv.lastTimestamp).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/chat', { state: { otherUserId: conv.otherUserId, otherUserName: conv.otherUserName } })}
                  className="px-4 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform"
                >
                  {conv.hasMessages === false ? 'Start Chat' : 'Open Chat'}
                </button>
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
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '', availability: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  // Skill editing state
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [skillEditForm, setSkillEditForm] = useState({ skillName: '', description: '', type: '', location: '', availability: '' });
  const [skillSaveLoading, setSkillSaveLoading] = useState(false);
  const userId = localStorage.getItem('userId');

  const fetchProfile = async () => {
    if (!userId) return;
    try {
      const [profileRes, skillsRes] = await Promise.all([
        fetch(`/api/profile/${userId}`),
        fetch(`/api/skills/user/${userId}`)
      ]);

      const profileData = await profileRes.json();
      const skillsData = await skillsRes.json();

      setProfile(profileData);
      setEditForm({
        name: profileData.name || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        availability: profileData.availability || ''
      });
      setUserSkills(skillsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const result = await res.json();
      if (res.ok) {
        setProfile(result.user);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(result.message || 'Failed to update profile');
      }
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    }
    setSaveLoading(false);
  };

  // Skill editing handlers
  const handleStartEditSkill = (skill) => {
    setEditingSkillId(skill._id);
    setSkillEditForm({
      skillName: skill.skillName || '',
      description: skill.description || '',
      type: skill.type || 'offer',
      location: skill.location || '',
      availability: skill.availability || ''
    });
  };

  const handleSkillEditChange = (e) => {
    setSkillEditForm({ ...skillEditForm, [e.target.name]: e.target.value });
  };

  const handleSaveSkill = async () => {
    setSkillSaveLoading(true);
    try {
      const res = await fetch(`/api/skills/${editingSkillId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...skillEditForm })
      });
      const result = await res.json();
      if (res.ok) {
        await fetchProfile(); // Refresh skills
        setEditingSkillId(null);
        alert('Skill updated successfully!');
      } else {
        alert(result.message || 'Failed to update skill');
      }
    } catch (err) {
      alert('Failed to update skill: ' + err.message);
    }
    setSkillSaveLoading(false);
  };

  const handleCancelEditSkill = () => {
    setEditingSkillId(null);
    setSkillEditForm({ skillName: '', description: '', type: '', location: '', availability: '' });
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(prev => ({ ...prev, [skillId]: true }));

    try {
      console.log('Deleting skill from profile:', { skillId, userId });

      const res = await fetch(`/api/skills/${skillId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const result = await res.json();
      console.log('Profile delete response:', { status: res.status, result });

      if (res.ok) {
        // Refresh skills list
        await fetchProfile();
        alert('Skill deleted successfully');
      } else {
        console.error('Profile delete failed:', result);
        alert(result.message || 'Failed to delete skill');
      }
    } catch (err) {
      console.error('Error deleting skill from profile:', err);
      alert('Failed to delete skill: ' + err.message);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [skillId]: false }));
    }
  };

  if (!userId) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Please log in.</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-credBlack text-credWhite font-display">Loading...</div>;

  return (
    <div className="min-h-screen bg-credBlack text-credWhite font-display flex flex-col items-center py-4 sm:py-8 px-4">
      <div className="w-full max-w-4xl space-y-4 sm:space-y-6">
        {/* Profile Information */}
        <div className="bg-credGray rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
            <h2 className="text-3xl font-bold">Your Profile</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform"
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-credWhite/70 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent"
                />
              </div>
              <div>
                <label className="block text-sm text-credWhite/70 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleEditChange}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent"
                  placeholder="Tell others about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm text-credWhite/70 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent"
                  placeholder="e.g. New York, NY"
                />
              </div>
              <div>
                <label className="block text-sm text-credWhite/70 mb-1">Availability</label>
                <input
                  type="text"
                  name="availability"
                  value={editForm.availability}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 rounded-lg bg-credBlack text-credWhite border border-credGray focus:outline-none focus:ring-2 focus:ring-credAccent"
                  placeholder="e.g. Weekends, Evenings"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                  className="px-6 py-2 rounded-full bg-green-500 text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {saveLoading ? 'Saving...' : '✓ Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      name: profile.name || '',
                      bio: profile.bio || '',
                      location: profile.location || '',
                      availability: profile.availability || ''
                    });
                  }}
                  className="px-6 py-2 rounded-full bg-credBlack text-credWhite font-semibold border border-credWhite/30 hover:bg-credWhite/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="font-bold text-lg">{profile?.name}</div>
              <div className="text-credWhite/70">{profile?.email}</div>
              {profile?.location && <div className="text-credWhite/70">📍 {profile.location}</div>}
              {profile?.availability && <div className="text-credWhite/70">⏰ {profile.availability}</div>}
              {profile?.bio && <div className="text-credWhite/70 mt-2 italic">"{profile.bio}"</div>}
            </div>
          )}
          <ReviewSection userId={userId} />
        </div>

        {/* My Skills Section */}
        <div className="bg-credGray rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h3 className="text-2xl font-bold">My Skills</h3>
            <Link to="/post-skill" className="px-4 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform">
              Post New Skill
            </Link>
          </div>

          {userSkills.length === 0 ? (
            <div className="text-center text-credWhite/60 py-8">
              You haven't posted any skills yet.
              <Link to="/post-skill" className="text-credAccent hover:underline ml-1">Post your first skill!</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userSkills.map(skill => (
                <div key={skill._id} className="bg-credBlack rounded-xl p-4 shadow-lg flex flex-col space-y-2">
                  {editingSkillId === skill._id ? (
                    // Edit form for skill
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-credWhite/60 mb-1">Type</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input type="radio" name="type" value="offer" checked={skillEditForm.type === 'offer'} onChange={handleSkillEditChange} className="mr-2" /> Offer
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name="type" value="request" checked={skillEditForm.type === 'request'} onChange={handleSkillEditChange} className="mr-2" /> Request
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-credWhite/60 mb-1">Skill Name</label>
                        <input
                          type="text"
                          name="skillName"
                          value={skillEditForm.skillName}
                          onChange={handleSkillEditChange}
                          className="w-full px-3 py-2 rounded-lg bg-credGray text-credWhite border border-credWhite/20 focus:outline-none focus:ring-2 focus:ring-credAccent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-credWhite/60 mb-1">Description</label>
                        <textarea
                          name="description"
                          value={skillEditForm.description}
                          onChange={handleSkillEditChange}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-credGray text-credWhite border border-credWhite/20 focus:outline-none focus:ring-2 focus:ring-credAccent text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-credWhite/60 mb-1">Location</label>
                          <input
                            type="text"
                            name="location"
                            value={skillEditForm.location}
                            onChange={handleSkillEditChange}
                            className="w-full px-3 py-2 rounded-lg bg-credGray text-credWhite border border-credWhite/20 focus:outline-none focus:ring-2 focus:ring-credAccent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-credWhite/60 mb-1">Availability</label>
                          <input
                            type="text"
                            name="availability"
                            value={skillEditForm.availability}
                            onChange={handleSkillEditChange}
                            className="w-full px-3 py-2 rounded-lg bg-credGray text-credWhite border border-credWhite/20 focus:outline-none focus:ring-2 focus:ring-credAccent text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={handleSaveSkill}
                          disabled={skillSaveLoading}
                          className="px-4 py-2 rounded-full bg-green-500 text-black text-sm font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                        >
                          {skillSaveLoading ? 'Saving...' : '✓ Save'}
                        </button>
                        <button
                          onClick={handleCancelEditSkill}
                          className="px-4 py-2 rounded-full bg-credGray text-credWhite text-sm font-semibold border border-credWhite/30 hover:bg-credWhite/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal skill display
                    <>
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                          style={{ background: skill.type === 'offer' ? '#2ed573' : '#232326', color: skill.type === 'offer' ? '#18181a' : '#f7f7fa' }}>
                          {skill.type}
                        </span>
                        <span className="text-sm text-credWhite/60">{new Date(skill.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-lg font-bold">{skill.skillName}</h4>
                      <p className="text-credWhite/80 text-sm">{skill.description}</p>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-credWhite/70 text-xs">
                        <span>Location: {skill.location || 'N/A'}</span>
                        <span>Availability: {skill.availability || 'N/A'}</span>
                      </div>

                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => handleStartEditSkill(skill)}
                          className="px-3 py-2 rounded-full bg-credAccent text-credBlack text-sm font-semibold hover:scale-105 transition-transform"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill._id)}
                          disabled={deleteLoading[skill._id]}
                          className="px-3 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                        >
                          {deleteLoading[skill._id] ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewSection({ userId }) {
  const [reviewData, setReviewData] = useState({ reviews: [], averageRating: 0, ratingCount: 0 });
  const [ratableMatches, setRatableMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch reviews for this user
        const reviewsRes = await fetch(`/api/reviews/${userId}`, { headers });
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setReviewData(data);
        }

        // If viewing own profile, fetch ratable matches
        if (currentUserId) {
          const matchesRes = await fetch(`/api/reviews/ratable-matches/${currentUserId}`, { headers });
          if (matchesRes.ok) {
            const matches = await matchesRes.json();
            // Filter to only matches where the offerer is the profile being viewed
            setRatableMatches(matches.filter(m => m.offererId?._id === userId || m.offererId === userId));
          }
        }
      } catch (err) {
        console.error('Error fetching review data:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [userId, currentUserId, token]);

  if (loading) return <div>Loading reviews...</div>;

  const { reviews, averageRating, ratingCount } = reviewData;

  return (
    <div className="mt-6">
      <div className="font-semibold mb-2">
        Reviews
        {ratingCount > 0 && (
          <span className="ml-2 text-credAccent">★ {averageRating} ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})</span>
        )}
      </div>
      <ul className="space-y-2">
        {(!reviews || reviews.length === 0) ? (
          <li className="text-credWhite/60">No reviews yet.</li>
        ) : (
          reviews.map((r, i) => (
            <li key={i} className="bg-credBlack rounded-lg p-3">
              <span className="font-bold">{r.reviewerId?.name || 'User'}:</span>
              <span className="text-credAccent ml-2">{r.rating}★</span>
              {r.matchId?.skillName && <span className="text-credWhite/60 text-sm ml-2">({r.matchId.skillName})</span>}
              <div className="mt-1 text-credWhite/80">{r.comment}</div>
            </li>
          ))
        )}
      </ul>
      {ratableMatches.length > 0 && <LeaveReview targetUserId={userId} ratableMatches={ratableMatches} />}
    </div>
  );
}

function LeaveReview({ targetUserId, ratableMatches }) {
  const [selectedMatch, setSelectedMatch] = useState('');
  const [form, setForm] = useState({ rating: '', comment: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem('token');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedMatch) {
      setError('Please select a skill exchange to rate');
      return;
    }
    setSuccess(''); setError(''); setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ matchId: selectedMatch, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to post review');
      setSuccess('Review posted successfully!');
      setForm({ rating: '', comment: '' });
      setSelectedMatch('');
      // Refresh the page after a short delay to show updated reviews
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  if (!ratableMatches || ratableMatches.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-credBlack/50 rounded-lg border border-credGray/30">
      <h4 className="font-semibold mb-3">Rate this skill provider</h4>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-credWhite/70 mb-1">Skill Exchange:</label>
          <select
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
            className="w-full rounded px-3 py-2 bg-credBlack text-credWhite border border-credGray"
          >
            <option value="">Select a completed exchange</option>
            {ratableMatches.map(match => (
              <option key={match._id} value={match._id}>
                {match.skillName || match.skillId?.skillName || 'Skill Exchange'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm text-credWhite/70">Rating:</label>
          <select
            name="rating"
            value={form.rating}
            onChange={handleChange}
            className="rounded px-3 py-2 bg-credBlack text-credWhite border border-credGray"
            required
          >
            <option value="">Select</option>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-credWhite/70 mb-1">Comment (optional):</label>
          <textarea
            name="comment"
            value={form.comment}
            onChange={handleChange}
            placeholder="Share your experience..."
            className="w-full rounded px-3 py-2 bg-credBlack text-credWhite border border-credGray min-h-[80px]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !form.rating || !selectedMatch}
          className="px-6 py-2 rounded-full bg-credAccent text-credBlack font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>

      {success && <div className="text-green-400 text-sm mt-2">{success}</div>}
      {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
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
  const token = localStorage.getItem('token');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!userId || !token) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 401) {
            // Token expired or invalid, clear storage
            console.log('Token expired, please log in again');
          }
          return;
        }
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
        setUnreadCount(Array.isArray(data) ? data.filter(n => !n.isRead).length : 0);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('new_notification', (data) => {
      if (data.userId === userId) {
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => socket.disconnect();
  }, [userId, token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch(`/api/notifications/mark-all-read/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match_request': return '📩';
      case 'match_accepted': return '🎉';
      case 'match_declined': return '❌';
      case 'new_message': return '💬';
      default: return '🔔';
    }
  };

  if (!userId) return null;

  return (
    <nav className="w-full flex flex-wrap justify-center items-center gap-2 sm:gap-4 md:gap-6 py-3 sm:py-4 px-2 bg-credGray text-credWhite font-display relative">
      <button onClick={() => navigate('/skills')} className="hover:text-credAccent text-sm sm:text-base">Skill Board</button>
      <button onClick={() => navigate('/post-skill')} className="hover:text-credAccent text-sm sm:text-base">Post Skill</button>
      <button onClick={() => navigate('/matches')} className="hover:text-credAccent text-sm sm:text-base">Matches</button>
      <button onClick={() => navigate('/chats')} className="hover:text-credAccent text-sm sm:text-base">Chats</button>


      <div className="relative" ref={notifRef}>
        <button onClick={() => setShowNotifications(!showNotifications)} className="relative hover:text-credAccent">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-credBlack border border-credGray rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-credGray">
              <span className="font-bold">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-credAccent hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-credWhite/60">No notifications</div>
              ) : (
                notifications.slice(0, 10).map(notif => (
                  <div key={notif._id} className={`p-3 border-b border-credGray/30 hover:bg-credGray/50 cursor-pointer ${!notif.isRead ? 'bg-credAccent/10' : ''}`}
                    onClick={() => { navigate(notif.type.includes('match') ? '/matches' : '/chats'); setShowNotifications(false); }}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{getNotificationIcon(notif.type)}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{notif.title}</div>
                        <div className="text-xs text-credWhite/70">{notif.message}</div>
                        <div className="text-xs text-credWhite/40 mt-1">{new Date(notif.createdAt).toLocaleString()}</div>
                      </div>
                      {!notif.isRead && <span className="w-2 h-2 bg-credAccent rounded-full mt-1"></span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => navigate('/profile')} className="hover:text-credAccent text-sm sm:text-base">Profile</button>
      <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="hover:text-credAccent text-sm sm:text-base">Logout</button>
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
