import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { connectSocket, disconnectSocket } from '../socket/socket';
import { useSocket } from '../hooks/useSocket';
import { useCanvas } from '../hooks/useCanvas';
import { undoLocal, redoLocal, clearElements } from '../store/canvasSlice';
import CanvasBoard from '../components/CanvasBoard';
import Toolbar     from '../components/Toolbar';
import UserList    from '../components/UserList';

export default function RoomPage() {
  const { id: roomId } = useParams();
  const navigate       = useNavigate();
  const dispatch       = useDispatch();

  const token      = useSelector(s => s.auth.token);
  const username   = useSelector(s => s.auth.username);
  const connected  = useRef(false);
  const socketRef  = useRef(null);
  const stageRef   = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 600);

  // ── Connect socket & join room ──────────────────────────────────
  useEffect(() => {
    if (!token || connected.current) return;
    connected.current = true;

    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', { roomId });
    });

    socket.on('error', ({ message }) => {
      alert(`Room error: ${message}`);
      navigate('/');
    });

    return () => {
      disconnectSocket();
      connected.current = false;
    };
  }, [token, roomId, navigate]);

  // ── Listen to socket events → Redux ────────────────────────────
  useSocket(socketRef.current, roomId);

  // ── Canvas drawing logic ────────────────────────────────────────
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useCanvas(socketRef.current, roomId);

  // ── Undo ────────────────────────────────────────────────────────
  const undoStack = useSelector(s => s.canvas.undoStack);
  const handleUndo = useCallback(() => {
    const elementId = undoStack[undoStack.length - 1];
    if (!elementId) return;
    dispatch(undoLocal());
    if (socketRef.current) socketRef.current.emit('undo', { roomId, elementId });
  }, [undoStack, dispatch, roomId]);

  // ── Redo ────────────────────────────────────────────────────────
  const redoStack = useSelector(s => s.canvas.redoStack);
  const handleRedo = useCallback(() => {
    const el = redoStack[redoStack.length - 1];
    if (!el) return;
    dispatch(redoLocal());
    if (socketRef.current) {
      socketRef.current.emit('draw-stroke', { roomId, operation: { type: 'add', element: el } });
    }
  }, [redoStack, dispatch, roomId]);

  // ── Clear canvas ────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    if (!window.confirm('Clear the entire canvas for everyone?')) return;
    dispatch(clearElements());
    if (socketRef.current) socketRef.current.emit('clear-canvas', { roomId });
  }, [dispatch, roomId]);

  // ── Export PNG ──────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const a   = document.createElement('a');
    a.href     = uri;
    a.download = `boardcollab-${roomId}.png`;
    a.click();
  }, [roomId]);

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  return (
    <div className="room-layout">
      {/* Top horizontal toolbar */}
      <Toolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        sidebarOpen={sidebarOpen}
      />

      {/* Canvas + sidebar row */}
      <div className="room-body">
        <CanvasBoard
          stageRef={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          sidebarOpen={sidebarOpen}
        />
        <UserList roomId={roomId} collapsed={!sidebarOpen} />
      </div>

      <div className="status-bar">
        <span className="status-dot" />
        <span>{username} · {roomId}</span>
      </div>
    </div>
  );
}