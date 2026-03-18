import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { clearAuth } from '../store/authSlice';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LobbyPage() {
  const [roomName, setRoomName] = useState('');
  const [joinId, setJoinId]     = useState('');
  const [error, setError]       = useState('');
  const [created, setCreated]   = useState(null); // show room code after creation

  const token    = useSelector(s => s.auth.token);
  const username = useSelector(s => s.auth.username);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const headers = { Authorization: `Bearer ${token}` };

  const createRoom = async (e) => {
    e.preventDefault();
    setError('');
    setCreated(null);
    try {
      const { data } = await axios.post(`${API}/api/rooms`, { name: roomName || 'Untitled Room' }, { headers });
      setCreated(data); // show the room code so user can share it
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    navigate(`/room/${joinId.trim().toUpperCase()}`);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(created.roomId);
  };

  return (
    <div className="lobby-page">
      <div className="lobby-header">
        <h1>🎨 BoardCollab</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="user-badge">👤 {username}</span>
          <button className="btn btn-ghost" onClick={() => dispatch(clearAuth())}>Sign Out</button>
        </div>
      </div>

      {error && <div className="error-msg" style={{ maxWidth: 700, marginBottom: '1rem' }}>{error}</div>}

      <div className="lobby-grid">

        {/* ── Create Room ── */}
        <div className="lobby-section">
          <h2>Create a Room</h2>
          {!created ? (
            <form onSubmit={createRoom} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text" placeholder="Room name (optional)"
                value={roomName} onChange={e => setRoomName(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem 0.8rem', color: 'var(--text)', fontSize: '0.9rem' }}
              />
              <button className="btn btn-primary" type="submit">+ Create Room</button>
            </form>
          ) : (
            /* Show room code to share — only creator sees this */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Room <strong style={{ color: 'var(--text)' }}>{created.name}</strong> created!
                Share this code with people you want to invite:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  flex: 1, background: 'var(--bg)', border: '1px solid var(--accent)',
                  borderRadius: 8, padding: '0.75rem 1rem',
                  fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700,
                  color: 'var(--accent)', letterSpacing: '0.15em', textAlign: 'center'
                }}>
                  {created.roomId}
                </div>
                <button className="btn btn-secondary" onClick={copyCode} title="Copy code">📋</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/room/${created.roomId}`)}>
                  Enter Room →
                </button>
                <button className="btn btn-ghost" onClick={() => { setCreated(null); setRoomName(''); }}>
                  New
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Join by Code ── */}
        <div className="lobby-section">
          <h2>Join a Room</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Enter the room code shared with you.
          </p>
          <form onSubmit={joinRoom} className="join-form">
            <input
              type="text" placeholder="e.g. AB3F7K2"
              value={joinId} onChange={e => setJoinId(e.target.value)}
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}
            />
            <button className="btn btn-secondary" type="submit">Join →</button>
          </form>
        </div>

      </div>

      {/* How it works hint */}
      <div style={{ maxWidth: 700, marginTop: '2rem', padding: '1rem 1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          🔒 <strong style={{ color: 'var(--text)' }}>Rooms are private by default.</strong> Only people with the room code can join.
          Create a room, copy the code, and share it with your team via WhatsApp, Slack, or any chat.
        </p>
      </div>
    </div>
  );
}