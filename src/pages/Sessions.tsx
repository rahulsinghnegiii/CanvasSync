import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { useNotification } from '../contexts/NotificationContext';
import Header from '../components/Header';
import type { Session } from '../types/Session';
import { formatDate } from '../utils/dateUtils';

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { getSessionsForUser, joinSession, deleteSession } = useSession();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const userSessions = await getSessionsForUser();
        setSessions(userSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        showNotification('error', 'Failed to load your sessions', 5000);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [getSessionsForUser, showNotification]);

  const handleJoinSession = async (sessionId: string) => {
    try {
      showNotification('info', 'Joining session...', 2000);
      const success = await joinSession(sessionId);
      if (success) {
        navigate(`/whiteboard/${sessionId}`);
      } else {
        showNotification('error', 'Failed to join session', 5000);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      showNotification('error', 'An error occurred while joining the session', 5000);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      showNotification('success', 'Session deleted successfully', 3000);
    } catch (error) {
      console.error('Error deleting session:', error);
      showNotification('error', 'Failed to delete session', 5000);
    }
  };

  const handleCreateSession = () => {
    navigate('/whiteboard');
  };

  return (
    <div className="app-container">
      <Header title="My Sessions" />

      <main className="sessions-page">
        <div className="sessions-header">
          <h1>My Whiteboard Sessions</h1>
          <button 
            className="btn btn-primary" 
            onClick={handleCreateSession}
          >
            Create New Session
          </button>
        </div>

        <div className="sessions-container">
          {loading ? (
            <div className="loading-indicator">
              <p>Loading your sessions...</p>
            </div>
          ) : sessions.length > 0 ? (
            <div className="sessions-grid">
              {sessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-info">
                    <h3 className="session-title">
                      Session {session.id.substring(0, 8)}
                    </h3>
                    <p className="session-date">
                      Created: {formatDate(new Date(session.createdAt))}
                    </p>
                    {session.lastModified && (
                      <p className="session-date">
                        Last modified: {formatDate(new Date(session.lastModified))}
                      </p>
                    )}
                    <p className="session-participants">
                      <span className="icon">👥</span> 
                      {session.participantCount || 0} participants
                    </p>
                  </div>
                  <div className="session-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleJoinSession(session.id)}
                    >
                      Open Session
                    </button>
                    <button
                      className="btn btn-outline btn-sm text-danger"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-sessions">
              <p>You don't have any sessions yet.</p>
              <button 
                className="btn btn-primary" 
                onClick={handleCreateSession}
              >
                Create Your First Session
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Sessions; 