import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { authState, logout } = useAuth();

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <div className="brand">
            <Link to="/">
              canvas<span>sync</span>
            </Link>
            {title && <span className="header-title ml-4 text-muted">/ {title}</span>}
          </div>
          
          <nav className="nav">
            {authState.isAuthenticated ? (
              <>
                <Link to="/sessions" className="nav-link">
                  My Sessions
                </Link>
                <Link to="/profile" className="nav-link">
                  Profile
                </Link>
                <button 
                  onClick={logout} 
                  className="btn btn-outline btn-sm"
                >
                  Sign Out
                </button>
                <div 
                  className="participant-avatar" 
                  style={{ 
                    backgroundColor: authState.user?.avatarColor || '#ccc',
                    width: '32px',
                    height: '32px'
                  }}
                  title={authState.user?.username || 'User'}
                />
              </>
            ) : (
              <>
                <Link to="/login" className="btn">
                  Sign In
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 