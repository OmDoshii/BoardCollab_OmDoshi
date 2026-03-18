import React, { useEffect, useState } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text } from 'react-konva';
import { useSelector } from 'react-redux';

const SIDEBAR_W  = 200;
const TOOLBAR_H  = 52;

export default function CanvasBoard({ onMouseDown, onMouseMove, onMouseUp, stageRef, sidebarOpen }) {
  const elements   = useSelector(s => s.canvas.elements);
  const activeTool = useSelector(s => s.canvas.activeTool);

  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight - TOOLBAR_H });

  useEffect(() => {
    const update = () => {
      const sidebarWidth = sidebarOpen && window.innerWidth > 480 ? SIDEBAR_W : 0;
      setSize({
        w: window.innerWidth  - sidebarWidth,
        h: window.innerHeight - TOOLBAR_H,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [sidebarOpen]);

  const renderElement = (el) => {
    if (!el || !el.data) return null;
    const d = el.data;

    switch (el.type) {
      case 'stroke':
        return (
          <Line
            key={el.id}
            points={d.points}
            stroke={d.stroke}
            strokeWidth={d.strokeWidth}
            lineCap={d.lineCap || 'round'}
            lineJoin={d.lineJoin || 'round'}
            tension={0.5}
            globalCompositeOperation="source-over"
          />
        );
      case 'rect':
        return (
          <Rect
            key={el.id}
            x={d.x} y={d.y}
            width={d.width} height={d.height}
            stroke={d.stroke} strokeWidth={d.strokeWidth}
            fill={d.fill || 'transparent'}
          />
        );
      case 'circle':
        return (
          <Circle
            key={el.id}
            x={d.x} y={d.y}
            radius={Math.max(0, d.radius || 0)}
            stroke={d.stroke} strokeWidth={d.strokeWidth}
            fill={d.fill || 'transparent'}
          />
        );
      case 'text':
        return (
          <Text
            key={el.id}
            x={d.x} y={d.y}
            text={d.text}
            fill={d.fill}
            fontSize={d.fontSize || 18}
            fontFamily="Segoe UI, sans-serif"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`canvas-area tool-${activeTool}`}>
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onMouseDown}
        onTouchMove={onMouseMove}
        onTouchEnd={onMouseUp}
        style={{ background: '#ffffff', display: 'block' }}
      >
        <Layer>
          {elements.map(renderElement)}
        </Layer>
      </Stage>
    </div>
  );
}