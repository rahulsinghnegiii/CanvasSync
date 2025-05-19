import React, { useState } from 'react';

interface UserGuideProps {
  onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Function to render a placeholder image with an icon
  const renderPlaceholder = (iconClass: string, bgColor: string = '#e9ecef') => (
    <div 
      className="d-flex align-items-center justify-content-center mb-3 mx-auto" 
      style={{ 
        width: '200px', 
        height: '150px', 
        backgroundColor: bgColor,
        borderRadius: '8px'
      }}
    >
      <i className={`bi ${iconClass}`} style={{ fontSize: '4rem', color: '#6c757d' }}></i>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            {renderPlaceholder('bi-house-door', '#e0f7fa')}
            <h4>Welcome to Collaborative Whiteboard</h4>
            <p>
              This guide will help you get started with the collaborative whiteboard application.
              You'll learn how to create a whiteboard, use the drawing tools, invite others to collaborate,
              and more.
            </p>
          </div>
        );
      case 2:
        return (
          <div className="step-content">
            {renderPlaceholder('bi-plus-circle', '#e8f5e9')}
            <h4>Creating and Joining Sessions</h4>
            <p>
              You can create a new whiteboard session from the home page or join an existing 
              session using a session ID. Each session has a unique ID that you can share with others.
            </p>
            <div className="alert alert-info">
              <i className="bi bi-lightbulb me-2"></i>
              Tip: You can find all your previous sessions in the "My Sessions" page.
            </div>
          </div>
        );
      case 3:
        return (
          <div className="step-content">
            {renderPlaceholder('bi-pencil', '#fff3e0')}
            <h4>Using Drawing Tools</h4>
            <p>
              The whiteboard offers several drawing tools:
            </p>
            <ul className="text-start">
              <li><strong>Brush:</strong> Free-form drawing with adjustable color and size</li>
              <li><strong>Eraser:</strong> Remove parts of your drawing</li>
              <li><strong>Undo/Redo:</strong> Quickly fix mistakes with Ctrl+Z and Ctrl+Shift+Z</li>
              <li><strong>Clear:</strong> Start fresh by clearing the entire canvas</li>
            </ul>
          </div>
        );
      case 4:
        return (
          <div className="step-content">
            {renderPlaceholder('bi-people', '#f3e5f5')}
            <h4>Real-Time Collaboration</h4>
            <p>
              Collaborate with others in real-time! You can:
            </p>
            <ul className="text-start">
              <li>See other users' cursors as they move on the canvas</li>
              <li>Chat with other participants using the chat panel</li>
              <li>Invite others via a shareable link or email</li>
              <li>See who's currently in the session in the participants list</li>
            </ul>
          </div>
        );
      case 5:
        return (
          <div className="step-content">
            {renderPlaceholder('bi-gear', '#e8eaf6')}
            <h4>Advanced Features</h4>
            <p>
              The whiteboard has several advanced features:
            </p>
            <ul className="text-start">
              <li><strong>Image Upload:</strong> Add images to your whiteboard</li>
              <li><strong>AI Classification:</strong> The system can identify objects in your images</li>
              <li><strong>Export:</strong> Export your whiteboard as PNG or PDF</li>
              <li><strong>Profile Customization:</strong> Change your username and avatar color</li>
            </ul>
            <div className="alert alert-success mt-3">
              <i className="bi bi-check-circle me-2"></i>
              You're all set! Click "Finish" to start using the whiteboard.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-backdrop show" style={{ display: 'block' }} onClick={onClose}>
      <div 
        className="modal-dialog modal-dialog-centered modal-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Getting Started Guide</h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body text-center p-4">
            {getStepContent()}
            
            <div className="progress mt-4">
              <div 
                className="progress-bar bg-primary" 
                role="progressbar" 
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                aria-valuenow={(currentStep / totalSteps) * 100} 
                aria-valuemin={0} 
                aria-valuemax={100}
              />
            </div>
            <p className="mt-2 text-muted small">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-outline-secondary" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Previous
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleNext}
            >
              {currentStep === totalSteps ? (
                <>
                  Finish
                  <i className="bi bi-check-lg ms-2"></i>
                </>
              ) : (
                <>
                  Next
                  <i className="bi bi-arrow-right ms-2"></i>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide; 