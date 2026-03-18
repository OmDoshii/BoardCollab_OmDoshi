import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTool, setActiveColor, setStrokeWidth } from '../store/canvasSlice';

const TOOLS = [
  { id: 'pen',    icon: '✏️', title: 'Pen' },
  { id: 'rect',   icon: '▭',  title: 'Rectangle' },
  { id: 'circle', icon: '○',  title: 'Circle' },
  { id: 'text',   icon: 'T',  title: 'Text' },
];

export default function Toolbar({ onUndo, onRedo, onClear, onExport, onToggleSidebar, sidebarOpen }) {
  const dispatch    = useDispatch();
  const activeTool  = useSelector(s => s.canvas.activeTool);
  const activeColor = useSelector(s => s.canvas.activeColor);
  const strokeWidth = useSelector(s => s.canvas.strokeWidth);

  return (
    <div className="toolbar">
      {/* Drawing tools */}
      {TOOLS.map(t => (
        <button
          key={t.id}
          className={`tool-btn ${activeTool === t.id ? 'active' : ''}`}
          title={t.title}
          onClick={() => dispatch(setActiveTool(t.id))}
        >
          {t.icon}
        </button>
      ))}

      <div className="toolbar-divider" />

      {/* Color picker */}
      <input
        type="color"
        className="color-input"
        title="Color"
        value={activeColor}
        onChange={e => dispatch(setActiveColor(e.target.value))}
      />

      {/* Stroke width */}
      <input
        type="range" min="1" max="20" value={strokeWidth}
        className="stroke-slider"
        title="Stroke width"
        onChange={e => dispatch(setStrokeWidth(Number(e.target.value)))}
      />

      <div className="toolbar-divider" />

      {/* Undo / Redo */}
      <button className="tool-btn" title="Undo (Ctrl+Z)" onClick={onUndo}>↩</button>
      <button className="tool-btn" title="Redo (Ctrl+Y)" onClick={onRedo}>↪</button>

      <div className="toolbar-divider" />

      {/* Export */}
      <button className="tool-btn" title="Export PNG" onClick={onExport}>💾</button>

      {/* Clear */}
      <button className="tool-btn" title="Clear Canvas" onClick={onClear} style={{ color: '#e94560' }}>🗑</button>

      <div className="toolbar-spacer" />

      {/* Toggle sidebar — useful on mobile */}
      <button
        className={`tool-btn ${sidebarOpen ? 'active' : ''}`}
        title={sidebarOpen ? 'Hide panel' : 'Show users'}
        onClick={onToggleSidebar}
      >
        👥
      </button>
    </div>
  );
}