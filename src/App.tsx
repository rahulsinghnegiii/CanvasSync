import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Sessions from './pages/Sessions';
import Join from './pages/Join';
import Whiteboard from './pages/Whiteboard';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <SessionProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/join" element={<Join />} />
              <Route path="/join/:sessionId" element={<Join />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sessions" 
                element={
                  <ProtectedRoute>
                    <Sessions />
                  </ProtectedRoute>
                } 
              />
              <Route path="/whiteboard" element={<Whiteboard />} />
              <Route path="/whiteboard/:sessionId" element={<Whiteboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SessionProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
};

export default App;
