import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import WhiteboardCanvas from '../components/WhiteboardCanvas';
import ChatPanel from '../components/ChatPanel';
import InviteForm from '../components/InviteForm';
import { useSession } from '../contexts/SessionContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const Whiteboard: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { showNotification } = useNotification();
  const { 
    currentSession, 
    participants, 
    joinSession, 
    isConnected, 
    isConnecting, 
    error,
    leaveSession,
    getShareableLink,
    createSession
  } = useSession();

  const [linkCopied, setLinkCopied] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const hasShownJoinNotification = useRef(false);
  
  // Add a ref to track the component's mount status to prevent actions after dismount
  const isMounted = useRef(true);
  // Add a ref to track if we're already in a session
  const isInSession = useRef(false);
  // Add a ref to track if we're intentionally navigating away
  const isNavigating = useRef(false);
  // Add a ref to track if we're the first render of this component
  const isFirstRender = useRef(true);
  // Keep track of previous session ID to detect changes
  const prevSessionIdRef = useRef<string | undefined>(sessionId);

  // Set all refs properly on mount and cleanup on unmount
  useEffect(() => {
    console.log('Whiteboard component mounting with sessionId:', sessionId);
    isMounted.current = true;
    
    // Mark as no longer first render after the first effect runs
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
    
    return () => {
      console.log('Main cleanup effect executing for Whiteboard component');
      isMounted.current = false;
    };
  }, []);

  // Join session on mount if sessionId is provided
  useEffect(() => {
    if (!isMounted.current) return;
    
    // Skip joining if this is an unmount-remount cycle from React's development mode
    if (!isFirstRender.current && sessionId === prevSessionIdRef.current && isInSession.current) {
      console.log('Detected React development remount with same sessionId, skipping join');
      return;
    }
    
    prevSessionIdRef.current = sessionId;
    
    console.log('Whiteboard component mounted with params:', { 
      sessionId, 
      hasUser: !!authState.user, 
      isConnected, 
      isConnecting,
      hasCurrentSession: !!currentSession,
      isMounted: isMounted.current,
      isInSession: isInSession.current
    });
    
    // Check if we're already connected to the right session
    const alreadyInCorrectSession = isConnected && 
                                   currentSession && 
                                   sessionId && 
                                   currentSession.id === sessionId;
    
    if (alreadyInCorrectSession) {
      console.log('Already connected to the correct session:', sessionId);
      isInSession.current = true;
      return;
    }
    
    const handleCreateNewSession = async () => {
      console.log('Creating new session from Whiteboard component');
      try {
        showNotification('info', 'Creating new whiteboard session...');
        
        // Create a new session via SessionContext
        const newSessionId = await createSession();
        
        if (!newSessionId || newSessionId.trim() === '') {
          console.error('Failed to create new session: Empty session ID returned');
          showNotification('error', 'Failed to create new session');
          isNavigating.current = true;
          navigate('/');
          return;
        }
        
        console.log('New session created with ID:', newSessionId);
        isInSession.current = true;
        showNotification('success', 'Created new whiteboard session');
        
        // Navigate to the new session URL (this will unmount and remount the component)
        navigate(`/whiteboard/${newSessionId}`, { replace: true });
      } catch (err) {
        console.error('Error creating new session:', err);
        showNotification('error', 'Failed to create new session. Please try again.');
        
        // Add a short delay before navigating away
        setTimeout(() => {
          if (isMounted.current) {
            isNavigating.current = true;
            navigate('/');
          }
        }, 2000);
      }
    };
    
    // Handle special case for /whiteboard/new route
    if (sessionId === 'new') {
      handleCreateNewSession();
      return;
    }
    
    // Don't try to join if we're already in the process of joining or navigating away
    if (sessionId && authState.user && !isNavigating.current) {
      // Changed condition to check for sessionId and user even if already connected
      // This ensures that when coming from an invitation link, we attempt to join
      console.log('Attempting to join session:', sessionId);
      
      joinSession(sessionId).then(success => {
        // Don't do anything if the component has unmounted
        if (!isMounted.current) {
          console.log('Component unmounted before join completed, ignoring result');
          return;
        }
        
        console.log('Join session result:', success);
        
        if (success) {
          isInSession.current = true;
          showNotification('success', 'Connected to whiteboard session');
        } else {
          showNotification('error', 'Failed to join session');
          // Only navigate away if we failed to join and the component is still mounted
          isNavigating.current = true;
          navigate('/');
        }
      }).catch(err => {
        if (!isMounted.current) return;
        
        console.error('Error joining session:', err);
        showNotification('error', 'Error joining session');
        isNavigating.current = true;
        navigate('/');
      });
    } else {
      console.log('Not joining session because:', {
        hasSessionId: !!sessionId,
        hasUser: !!authState.user,
        isNavigating: isNavigating.current
      });
      
      // If no session ID but the user is authenticated, create a new session
      if (!sessionId && authState.user && !isConnected && !isInSession.current) {
        handleCreateNewSession();
      }
    }
  }, [sessionId, authState.user, isConnected, isConnecting, joinSession, createSession, currentSession, navigate, showNotification]);

  // Handle leaving the session when navigating away - using a separate memo to make it more stable
  const handleCleanup = React.useCallback(() => {
    console.log('Whiteboard component unmounting, isConnected:', isConnected, 
               'isNavigating:', isNavigating.current,
               'isInSession:', isInSession.current,
               'isMounted:', isMounted.current);
    
    // Prevent double cleanup
    if (!isMounted.current) {
      console.log('Component already unmounted, skipping cleanup');
      return;
    }
    
    // Only leave the session if ALL of these are true:
    // 1. We're connected
    // 2. We're in a session
    // 3. We're not intentionally navigating somewhere else
    // 4. We're not in a temporary unmount due to React development mode
    if (isConnected && 
        isInSession.current && 
        !isNavigating.current) {
      console.log('Leaving session during unmount (not due to navigation)');
      // When unmounting, we don't want to auto-navigate
      leaveSession(false);
    } else {
      console.log('Not leaving session on unmount - either not connected, not in session, or navigating');
    }
  }, [isConnected, leaveSession]);

  // Set up the cleanup effect
  useEffect(() => {
    console.log('Setting up cleanup for Whiteboard component');
    return handleCleanup;
  }, [handleCleanup]);

  // Show notification when a participant joins or leaves
  useEffect(() => {
    if (!isMounted.current) return;
    
    if (participants.length > 0 && isConnected && !hasShownJoinNotification.current) {
      const currentUser = authState.user?.username;
      // Check if the user just joined
      const userJustJoined = participants.some(p => p.username === currentUser);
      
      if (userJustJoined && participants.length >= 1) {
        // Mark that we've shown the notification to prevent repeats
        hasShownJoinNotification.current = true;
        
        // Only show join notification here if we didn't already show it during joinSession
        // We'll rely on the joinSession success notification instead
        console.log('User joined session - notification already handled in join process');
      }
    }
    
    // Reset notification flag when disconnected
    if (!isConnected) {
      hasShownJoinNotification.current = false;
    }
  }, [participants, isConnected, authState.user]);

  // Handle sharing session link
  const handleShareSession = () => {
    if (!sessionId && !currentSession) {
      showNotification('error', 'Cannot share: No active session');
      return;
    }
    
    const sessionIdToShare = sessionId || (currentSession?.id ?? '');
    if (!sessionIdToShare) {
      showNotification('error', 'Cannot share: Invalid session ID');
      return;
    }
    
    const link = getShareableLink(sessionIdToShare);
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    showNotification('success', 'Session link copied to clipboard');
    
    // Reset the copied state after a delay
    setTimeout(() => {
      if (isMounted.current) {
        setLinkCopied(false);
      }
    }, 2000);
  };

  // Handle showing invite form
  const handleShowInviteForm = () => {
    console.log('Opening invite form, sessionId:', sessionId);
    showNotification('info', 'Opening invitation form...', 1500);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    setShowInviteForm(true);
  };

  // Handle closing invite form
  const handleCloseInviteForm = () => {
    console.log('Closing invite form');
    document.body.style.overflow = ''; // Restore scrolling
    setShowInviteForm(false);
  };

  // Handle leaving session
  const handleLeaveSession = () => {
    console.log('User initiated leave session action');
    showNotification('info', 'You left the whiteboard session');
    // Mark that we're intentionally navigating to prevent the unmount handler from leaving again
    isNavigating.current = true;
    isInSession.current = false;
    // When manually leaving, we do want to navigate
    leaveSession(true);
  };

  return (
    <div className="app-container">
      <Header title={`Whiteboard ${currentSession ? `- ${currentSession.name}` : ''}`} />
      
      <main className="whiteboard">
        {error && (
          <div className="error-box container">
            {error}
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => {
                isNavigating.current = true;
                navigate('/');
              }}
            >
              Return to Home
            </button>
          </div>
        )}
        
        {isConnecting && (
          <div className="info-box container">
            <div className="loading-indicator">
              Connecting to session...
            </div>
          </div>
        )}
        
        {isConnected && sessionId && (
          <div className="whiteboard-header container">
            <div className="session-info">
              <span className="session-id">Session ID: {sessionId}</span>
              <span className="status-badge connected">Connected</span>
            </div>
            <div className="session-actions">
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleShareSession}
              >
                {linkCopied ? 'Link Copied!' : 'Share Link'}
              </button>
              <button 
                className="btn btn-outline btn-sm"
                onClick={handleShowInviteForm}
              >
                Invite by Email
              </button>
              <button 
                className="btn btn-outline btn-sm btn-danger"
                onClick={handleLeaveSession}
              >
                Leave Session
              </button>
            </div>
          </div>
        )}
        
        <div className="whiteboard-container">
          <div className="whiteboard-canvas">
            <WhiteboardCanvas />
          </div>
          <div className="whiteboard-sidebar">
            <div className="whiteboard-participants">
              <h4 className="participants-title">Participants ({participants.length})</h4>
              <div className="participant-list">
                {participants.map((participant, index) => (
                  <div key={index} className="participant-item">
                    <div 
                      className="participant-avatar" 
                      style={{ backgroundColor: participant.avatarColor || '#4A6FFF' }}
                    >
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="participant-info">
                      <div className="participant-name">
                        {participant.username}
                        {participant.username === authState.user?.username && (
                          <span className="participant-you"> (You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isConnected && <ChatPanel />}
          </div>
        </div>
      </main>

      {/* Email Invite Form - New Implementation */}
      {showInviteForm && (
        <InviteForm 
          sessionId={sessionId || (currentSession?.id || '')} 
          onClose={handleCloseInviteForm} 
        />
      )}
    </div>
  );
};

export default Whiteboard; 