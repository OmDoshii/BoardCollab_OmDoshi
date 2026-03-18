import { configureStore } from '@reduxjs/toolkit';
import canvasReducer from './canvasSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    canvas: canvasReducer,
    auth: authReducer,
  },
});
