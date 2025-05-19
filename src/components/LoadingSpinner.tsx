import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  fullScreen = false 
}) => {
  if (fullScreen) {
    return (
      <div className="spinner-overlay">
        <div className="spinner-container">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mb-0">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <div className="spinner-border text-primary mb-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mb-0">{message}</p>
    </div>
  );
};

export default LoadingSpinner; 