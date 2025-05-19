import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();

  const handleCreateWhiteboard = () => {
    navigate('/whiteboard');
  };

  const handleJoinSession = () => {
    navigate('/join');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="app-container">
      <Header />

      <main className="home-page">
        <div className="container">
          <section className="hero">
            <h1 className="hero-title">
              Collaborative <span className="accent">Whiteboard</span> for Teams
            </h1>
            <p className="hero-subtitle">
              Create, share and collaborate in real-time on a digital canvas
            </p>

            <div className="action-buttons">
              {authState.isAuthenticated ? (
                <>
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={handleCreateWhiteboard}
                  >
                    Create Whiteboard
                </button>
                  <button 
                    className="btn btn-outline btn-lg" 
                    onClick={handleJoinSession}
                  >
                    Join Existing Session
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-primary btn-lg" 
                  onClick={handleGoToLogin}
                >
                  Sign in to Start
                </button>
              )}
            </div>
          </section>

          <section className="features">
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v4l2 2"></path>
                  </svg>
                </div>
                <h3>Real-time Collaboration</h3>
                <p>Work together with your team in real-time, seeing changes as they happen.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </div>
                <h3>Share Easily</h3>
                <p>Invite others with a simple link. No account required to join a session.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                    <path d="M2 2l7.586 7.586"></path>
                    <circle cx="11" cy="11" r="2"></circle>
                  </svg>
                </div>
                <h3>Drawing Tools</h3>
                <p>Express your ideas with intuitive drawing tools and options.</p>
              </div>
          </div>
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} CanvasSync. All rights reserved.</p>
      </div>
      </footer>
    </div>
  );
};

export default Home; 