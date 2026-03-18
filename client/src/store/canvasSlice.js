import { createSlice } from '@reduxjs/toolkit';

const canvasSlice = createSlice({
  name: 'canvas',
  initialState: {
    elements: [],      // all elements on the canvas
    undoStack: [],     // per-user: list of element IDs I added (for undo)
    redoStack: [],     // element objects removed by undo (for redo)
    activeTool: 'pen', // 'pen' | 'rect' | 'circle' | 'text' | 'select'
    activeColor: '#1a1a2e',
    strokeWidth: 3,
    activeUsers: [],
  },
  reducers: {
    // Load initial state from server
    setElements(state, action) {
      state.elements = action.payload;
    },

    // Add a new element (from local draw or remote broadcast)
    addElement(state, action) {
      const el = action.payload;
      if (!state.elements.find(e => e.id === el.id)) {
        state.elements.push(el);
      }
    },

    // Update an existing element (e.g. while dragging)
    updateElement(state, action) {
      const idx = state.elements.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) state.elements[idx] = { ...state.elements[idx], ...action.payload };
    },

    // Delete one element by ID
    deleteElement(state, action) {
      state.elements = state.elements.filter(e => e.id !== action.payload);
    },

    // Clear all elements
    clearElements(state) {
      state.elements = [];
      state.undoStack = [];
      state.redoStack = [];
    },

    // Track local user's drawn element IDs for undo
    pushUndo(state, action) {
      state.undoStack.push(action.payload); // elementId
      state.redoStack = []; // new action clears redo
    },

    // Undo: remove last drawn element, push to redo
    undoLocal(state) {
      const elementId = state.undoStack.pop();
      if (!elementId) return;
      const el = state.elements.find(e => e.id === elementId);
      if (el) state.redoStack.push(el);
      state.elements = state.elements.filter(e => e.id !== elementId);
    },

    // Redo: re-add element from redo stack
    redoLocal(state) {
      const el = state.redoStack.pop();
      if (!el) return;
      state.undoStack.push(el.id);
      state.elements.push(el);
    },

    setActiveTool(state, action)   { state.activeTool   = action.payload; },
    setActiveColor(state, action)  { state.activeColor  = action.payload; },
    setStrokeWidth(state, action)  { state.strokeWidth  = action.payload; },
    setActiveUsers(state, action)  { state.activeUsers  = action.payload; },
  },
});

export const {
  setElements, addElement, updateElement, deleteElement, clearElements,
  pushUndo, undoLocal, redoLocal,
  setActiveTool, setActiveColor, setStrokeWidth, setActiveUsers,
} = canvasSlice.actions;

export default canvasSlice.reducer;
