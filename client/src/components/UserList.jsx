import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from '../store/authSlice';
import { clearElements } from '../store/canvasSlice';
import { disconnectSocket } from '../socket/socket';

// Generate a consistent color from a username string
function userColor(name = '') {
  const colors = ['#e94560','#0f3460','#533483','#05c46b','#ffd32a','#ff5e57','#0fbcf9','#f53b57'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function UserList({ roomId, collapsed }) {
  const activeUsers = useSelector(s => s.canvas.activeUsers);
  const username    = useSelector(s => s.auth.username);
  const dispatch    = useDispatch();
  const navigate    = useNavigate();

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  const handleLeave = () => {
    disconnectSocket();
    dispatch(clearElements());
    navigate('/');
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3>Room</h3>
        <button className="room-code" onClick={copyRoomId} title="Click to copy">
          {roomId}
        </button>
      </div>

      <div className="user-list">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Online — {activeUsers.length}
        </div>

        {activeUsers.map((u, i) => (
          <div className="user-item" key={i}>
            <div className="user-avatar" style={{ background: userColor(u.username) }}>
              {u.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: '0.85rem' }}>
              {u.username}
              {u.username === username && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> (you)</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={handleLeave}>
          ← Leave Room
        </button>
      </div>
    </div>
  );
}