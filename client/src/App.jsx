import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage    from './pages/LobbyPage';
import RoomPage     from './pages/RoomPage';

function PrivateRoute({ children }) {
  const token = useSelector(s => s.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/"         element={<PrivateRoute><LobbyPage /></PrivateRoute>} />
        <Route path="/room/:id" element={<PrivateRoute><RoomPage /></PrivateRoute>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
