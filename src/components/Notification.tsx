import React, { useState, useEffect } from 'react';

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Auto close notification after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade-out animation to complete
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  // Get appropriate background color based on type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-success';
      case 'error': return 'bg-danger';
      case 'warning': return 'bg-warning';
      case 'info': return 'bg-info';
      default: return 'bg-secondary';
    }
  };
  
  // Get appropriate icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-exclamation-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'info': return 'bi-info-circle-fill';
      default: return 'bi-bell-fill';
    }
  };

  return (
    <div 
      className={`position-fixed bottom-0 end-0 p-3 notification ${isVisible ? 'show' : 'hide'}`}
      style={{ zIndex: 1050 }}
    >
      <div 
        className={`toast show ${getBackgroundColor()} text-white`}
        role="alert" 
        aria-live="assertive" 
        aria-atomic="true"
      >
        <div className="toast-header text-white" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <i className={`bi ${getIcon()} me-2`}></i>
          <strong className="me-auto">
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </strong>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            aria-label="Close"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
          ></button>
        </div>
        <div className="toast-body">
          {message}
        </div>
      </div>
    </div>
  );
};

export default Notification; 