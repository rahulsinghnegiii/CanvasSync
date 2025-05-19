import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const Join: React.FC = () => {
  const { sessionId: paramSessionId } = useParams<{ sessionId?: string }>();
  const [sessionId, setSessionId] = useState(paramSessionId || '');
  const [isJoining, setIsJoining] = useState(false);
  const { joinSession } = useSession();
  const { showNotification } = useNotification();
  const { authState } = useAuth();
  const navigate = useNavigate();

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId.trim()) {
      showNotification('error', 'Please enter a session ID', 3000);
      return;
    }
    
    setIsJoining(true);
    
    try {
      const success = await joinSession(sessionId);
      if (success) {
        showNotification('success', 'Joining session...', 2000);
        navigate(`/whiteboard/${sessionId}`);
      } else {
        showNotification('error', 'Failed to join session. Please check the ID and try again.', 5000);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      showNotification('error', 'An error occurred while joining the session', 5000);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="app-container">
      <Header title="Join Session" />
      
      <main className="join-page">
        <div className="container">
          <div className="join-container">
            <h1>Join Whiteboard Session</h1>
            <p className="text-muted">
              Enter the session ID to join an existing whiteboard session
            </p>
            
            <form onSubmit={handleJoinSession} className="join-form">
              <div className="form-group">
                <label htmlFor="sessionId">Session ID</label>
                <input
                  type="text"
                  id="sessionId"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter the session ID"
                  className="form-control"
                  disabled={isJoining}
                  autoFocus
                />
              </div>
              
              <div className="button-group">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate('/')}
                  disabled={isJoining}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isJoining}
                >
                  {isJoining ? 'Joining...' : 'Join Session'}
                </button>
              </div>
            </form>

            {!authState.isAuthenticated && (
              <div className="auth-note">
                <p>
                  Note: You are joining as a guest. 
                  <button 
                    className="btn-link" 
                    onClick={() => navigate('/login', { state: { from: `/join/${sessionId}` } })}
                  >
                    Sign in
                  </button>
                  for more features.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Join; 