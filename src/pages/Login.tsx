import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Header from '../components/Header';

interface LocationState {
  from?: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [avatarColor, setAvatarColor] = useState('#4A6FFF');
  const { login, register, authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const { from } = (location.state as LocationState) || { from: '/' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      showNotification('error', 'Username is required', 3000);
      return;
    }

    try {
      if (isSignUp) {
        await register(username, password, avatarColor);
        showNotification('success', 'Account created successfully!', 3000);
      } else {
        await login(username, password);
      }
      navigate(from);
    } catch (error) {
      showNotification('error', 
        isSignUp ? 'Failed to create account. Please try again.' 
                : 'Invalid username or password', 
        5000
      );
    }
  };

  const predefinedColors = [
    '#4A6FFF', '#FF4A6F', '#6FFF4A', '#FF6F4A', 
    '#4AFF6F', '#6F4AFF', '#FFB74A', '#4AFFB7'
  ];

  return (
    <div className="app-container">
      <Header title={isSignUp ? 'Create Account' : 'Sign In'} />
      
      <main className="login-page">
        <div className="container">
          <div className="auth-container">
            <h1>{isSignUp ? 'Create Your Account' : 'Welcome Back'}</h1>
            <p className="text-muted">
              {isSignUp 
                ? 'Create an account to start making whiteboards' 
                : 'Sign in to continue to your account'
              }
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="form-control"
                  disabled={authState.loading}
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-control"
                  disabled={authState.loading}
                />
              </div>

              {isSignUp && (
                <div className="form-group">
                  <label>Select Avatar Color</label>
                  <div className="color-picker">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${avatarColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setAvatarColor(color)}
                        disabled={authState.loading}
                      />
                    ))}
                  </div>
                  <div className="avatar-preview">
                    <div 
                      className="avatar" 
                      style={{ backgroundColor: avatarColor }}
                    >
                      {username.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span>Your avatar</span>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={authState.loading}
              >
                {authState.loading 
                  ? 'Processing...' 
                  : isSignUp ? 'Create Account' : 'Sign In'
                }
              </button>
            </form>

            <div className="auth-toggle">
              <p>
                {isSignUp 
                  ? 'Already have an account?' 
                  : "Don't have an account?"
                }
                <button 
                  type="button"
                  className="btn-link"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={authState.loading}
                >
                  {isSignUp ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login; 