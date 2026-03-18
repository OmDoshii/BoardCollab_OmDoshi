import { createSlice } from '@reduxjs/toolkit';

const stored = localStorage.getItem('bc_user');
const initial = stored ? JSON.parse(stored) : { token: null, username: null, id: null };

const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setAuth(state, action) {
      state.token    = action.payload.token;
      state.username = action.payload.username;
      state.id       = action.payload.id;
      localStorage.setItem('bc_user', JSON.stringify(state));
    },
    clearAuth(state) {
      state.token    = null;
      state.username = null;
      state.id       = null;
      localStorage.removeItem('bc_user');
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
