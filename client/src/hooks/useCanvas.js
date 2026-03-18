import { useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { addElement, updateElement, pushUndo, undoLocal, redoLocal, deleteElement, clearElements } from '../store/canvasSlice';

export function useCanvas(socket, roomId) {
  const dispatch   = useDispatch();
  const activeTool  = useSelector(s => s.canvas.activeTool);
  const activeColor = useSelector(s => s.canvas.activeColor);
  const strokeWidth = useSelector(s => s.canvas.strokeWidth);

  const isDrawing  = useRef(false);
  const currentEl  = useRef(null);   // element being drawn right now
  const emitTimer  = useRef(null);   // debounce timer

  // Debounced emit: waits 200ms before sending to avoid flooding
  const emitOp = useCallback((operation) => {
    if (!socket || !roomId) return;
    if (emitTimer.current) clearTimeout(emitTimer.current);
    emitTimer.current = setTimeout(() => {
      socket.emit('draw-stroke', { roomId, operation });
    }, 50); // 50ms for smooth feel; increase to 200ms to save bandwidth
  }, [socket, roomId]);

  const emitNow = useCallback((operation) => {
    if (!socket || !roomId) return;
    socket.emit('draw-stroke', { roomId, operation });
  }, [socket, roomId]);

  // ─── Mouse down: start drawing ───────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (activeTool === 'select') return;
    isDrawing.current = true;

    const pos = e.target.getStage().getPointerPosition();
    const id  = uuidv4();
    const now = Date.now();

    let element;

    if (activeTool === 'pen') {
      element = {
        id, type: 'stroke', timestamp: now,
        data: { points: [pos.x, pos.y], stroke: activeColor, strokeWidth, lineCap: 'round', lineJoin: 'round' },
      };
    } else if (activeTool === 'rect') {
      element = {
        id, type: 'rect', timestamp: now,
        data: { x: pos.x, y: pos.y, width: 0, height: 0, stroke: activeColor, strokeWidth, fill: 'transparent' },
      };
    } else if (activeTool === 'circle') {
      element = {
        id, type: 'circle', timestamp: now,
        data: { x: pos.x, y: pos.y, radius: 0, stroke: activeColor, strokeWidth, fill: 'transparent' },
      };
    } else if (activeTool === 'text') {
      const text = window.prompt('Enter text:');
      if (!text) return;
      element = {
        id, type: 'text', timestamp: now,
        data: { x: pos.x, y: pos.y, text, fill: activeColor, fontSize: 18 },
      };
      // Text is complete immediately
      dispatch(addElement(element));
      dispatch(pushUndo(id));
      emitNow({ type: 'add', element });
      return;
    }

    currentEl.current = element;
    dispatch(addElement(element));
  }, [activeTool, activeColor, strokeWidth, dispatch, emitNow]);

  // ─── Mouse move: update shape ────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!isDrawing.current || !currentEl.current) return;

    const pos = e.target.getStage().getPointerPosition();
    const el  = currentEl.current;
    let updated;

    if (activeTool === 'pen') {
      updated = {
        ...el,
        data: { ...el.data, points: [...el.data.points, pos.x, pos.y] },
        timestamp: Date.now(),
      };
    } else if (activeTool === 'rect') {
      updated = {
        ...el,
        data: { ...el.data, width: pos.x - el.data.x, height: pos.y - el.data.y },
        timestamp: Date.now(),
      };
    } else if (activeTool === 'circle') {
      const dx = pos.x - el.data.x;
      const dy = pos.y - el.data.y;
      updated = {
        ...el,
        data: { ...el.data, radius: Math.sqrt(dx * dx + dy * dy) },
        timestamp: Date.now(),
      };
    }

    currentEl.current = updated;
    dispatch(updateElement(updated));
    emitOp({ type: 'update', element: updated });
  }, [activeTool, dispatch, emitOp]);

  // ─── Mouse up: finalize ──────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current || !currentEl.current) return;
    isDrawing.current = false;

    const el = currentEl.current;
    dispatch(pushUndo(el.id));
    emitNow({ type: 'add', element: el }); // final "add" op persists it
    currentEl.current = null;
  }, [dispatch, emitNow]);

  // ─── Undo ────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    // Get top of undo stack before dispatching
    // We read from store directly here via a ref approach
    dispatch(undoLocal());
    // Note: the actual elementId emit is handled in RoomPage
  }, [dispatch]);

  // ─── Redo ────────────────────────────────────────────────────────
  const handleRedo = useCallback(() => {
    dispatch(redoLocal());
  }, [dispatch]);

  return { handleMouseDown, handleMouseMove, handleMouseUp, handleUndo, handleRedo };
}
