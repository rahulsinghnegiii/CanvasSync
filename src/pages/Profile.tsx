import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Header from '../components/Header';

const Profile: React.FC = () => {
  const { authState, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [username, setUsername] = useState('');
  const [avatarColor, setAvatarColor] = useState('#4A6FFF');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  useEffect(() => {
    if (authState.user) {
      setUsername(authState.user.username || '');
      setAvatarColor(authState.user.avatarColor || '#4A6FFF');
    }
  }, [authState.user]);

  const predefinedColors = [
    '#4A6FFF', '#FF4A6F', '#6FFF4A', '#FF6F4A', 
    '#4AFF6F', '#6F4AFF', '#FFB74A', '#4AFFB7'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      showNotification('error', 'Username cannot be empty', 3000);
      return;
    }
    
    setIsSaving(true);
    
    try {
      await updateUser({ username, avatarColor });
      showNotification('success', 'Profile updated successfully', 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('error', 'Failed to update profile', 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      showNotification('error', 'Failed to log out', 5000);
    }
  };

  return (
    <div className="app-container">
      <Header title="Profile" />
      
      <main className="profile-page">
        <div className="container">
          <div className="profile-container">
            <h1>Your Profile</h1>
            
            <div className="profile-content">
              <div className="avatar-section">
                <div 
                  className="avatar large" 
                  style={{ backgroundColor: avatarColor }}
                >
                  {username.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="user-stats">
                  <h2>{username}</h2>
                  <p>Member since {new Date(authState.user?.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label htmlFor="username">Display Name</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your display name"
                    className="form-control"
                    disabled={isSaving}
                  />
                </div>
                
                <div className="form-group">
                  <label>Avatar Color</label>
                  <div className="color-picker">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${avatarColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setAvatarColor(color)}
                        disabled={isSaving}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="button-group">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-outline btn-danger"
                    onClick={() => setShowConfirmLogout(true)}
                    disabled={isSaving}
                  >
                    Sign Out
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      
      {showConfirmLogout && (
        <div className="modal-backdrop" onClick={() => setShowConfirmLogout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <h3>Sign Out</h3>
              <p>Are you sure you want to sign out?</p>
              <div className="button-group">
                <button 
                  className="btn btn-outline" 
                  onClick={() => setShowConfirmLogout(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 