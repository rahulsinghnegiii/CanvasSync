import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';

interface InviteFormProps {
  sessionId: string;
  onClose: () => void;
}

const InviteForm: React.FC<InviteFormProps> = ({ sessionId, onClose }) => {
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  // Create a ref for the modal content to handle clicks
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('New InviteForm rendered with sessionId:', sessionId);
  }, [sessionId]);

  // Handle clicks outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Make sure ESC key closes the modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Mock email sending function
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setSendResult({
        success: false,
        message: 'Please enter a valid email address'
      });
      return;
    }
    
    setIsSending(true);
    setSendResult(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // This is a mock implementation; in a real app, this would call a backend API
      console.log(`Invited ${email} to session ${sessionId} with message: ${message}`);
      
      setSendResult({
        success: true,
        message: `Invitation sent to ${email} successfully!`
      });
      
      // Show notification
      showNotification('success', `Invitation sent to ${email}`, 5000);
      
      // Reset form
      setEmail('');
      setMessage('');
      
      // Close form after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setSendResult({
        success: false,
        message: 'Failed to send invitation. Please try again.'
      });
      
      // Show error notification
      showNotification('error', 'Failed to send invitation', 5000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="invite-modal-overlay">
      <div 
        className="invite-modal" 
        ref={modalRef}
      >
        <div className="invite-modal-header">
          <h3>Invite Collaborator</h3>
          <button 
            className="invite-modal-close" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="invite-modal-body">
          <div className="invite-info-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>This is a mock email system. No actual emails will be sent.</span>
          </div>
          
          {sendResult && (
            <div className={sendResult.success ? 'invite-success-box' : 'invite-error-box'}>
              {sendResult.message}
            </div>
          )}
          
          <form onSubmit={handleSendInvite}>
            <div className="invite-form-group">
              <label htmlFor="email">Recipient Email</label>
              <input
                type="email"
                className="invite-form-control"
                id="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSending}
                required
                autoFocus
              />
            </div>
            
            <div className="invite-form-group">
              <label htmlFor="message">Message (Optional)</label>
              <textarea
                className="invite-form-control"
                id="message"
                rows={3}
                placeholder="Add a personal message to your invitation"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
              ></textarea>
            </div>
            
            <div className="invite-button-group">
              <button
                type="button"
                className="invite-btn invite-btn-outline"
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="invite-btn invite-btn-primary"
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteForm; 