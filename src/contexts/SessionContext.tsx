import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WhiteboardSession, User } from '../types';
import type { Session } from '../types/Session';
import { useAuth } from './AuthContext';
import sessionService from '../services/sessionService';
import webSocketService from '../services/webSocketService';

interface SessionContextType {
  currentSession: WhiteboardSession | null;
  participants: User[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  createSession: () => Promise<string>;
  joinSession: (sessionId: string) => Promise<boolean>;
  leaveSession: (shouldNavigate?: boolean) => void;
  getShareableLink: (sessionId: string) => string;
  getSessionsForUser: () => Promise<Session[]>;
  deleteSession: (sessionId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  currentSession: null,
  participants: [],
  isConnected: false,
  isConnecting: false,
  error: null,
  createSession: async () => '',
  joinSession: async () => false,
  leaveSession: () => {},
  getShareableLink: () => '',
  getSessionsForUser: async () => [],
  deleteSession: async () => {}
});

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  const [currentSession, setCurrentSession] = useState<WhiteboardSession | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to track current session to avoid dependency cycles
  const sessionRef = useRef<WhiteboardSession | null>(null);
  // Add a ref to track active navigation
  const navigatingRef = useRef<boolean>(false);
  // Add a ref to track active join session operations
  const joiningSessionRef = useRef<string | null>(null);
  
  // Keep the ref up to date with the state
  useEffect(() => {
    sessionRef.current = currentSession;
  }, [currentSession]);

  // Handle WebSocket connection status changes
  useEffect(() => {
    const unsubscribe = webSocketService.onConnectionChange((connected) => {
      console.log('WebSocket connection changed:', connected);
      setIsConnected(connected);
      if (!connected) {
        // Only clear current session if we're not in the middle of a join operation
        if (!joiningSessionRef.current) {
          console.log('Clearing current session on disconnect (not during join)');
          setCurrentSession(null);
        } else {
          console.log('Not clearing session as there is an active join operation:', joiningSessionRef.current);
        }
      }
    });
    
    return unsubscribe;
  }, []);

  // Handle participants changes - use ref instead of state in dependency array
  useEffect(() => {
    const unsubscribe = webSocketService.onParticipantsChange((newParticipants) => {
      console.log('Participants updated:', newParticipants);
      setParticipants(newParticipants);
      
      // Update current session with new participants if it exists
      // Using ref to avoid dependency on currentSession state
      if (sessionRef.current) {
        setCurrentSession({
          ...sessionRef.current,
          participants: newParticipants
        });
      }
    });
    
    return unsubscribe;
  }, []); // No dependencies needed since we use refs

  // Create a new session
  const createSession = async (): Promise<string> => {
    console.log('Creating session, auth state:', { 
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user 
    });

    if (!authState.isAuthenticated || !authState.user) {
      console.error('Cannot create session: User not authenticated');
      setError('You must be logged in to create a session');
      return '';
    }
    
    // Ensure user has required properties
    const user = { ...authState.user };
    if (!user.username) {
      user.username = 'Anonymous_' + Math.floor(Math.random() * 1000);
      console.warn('User missing username, using:', user.username);
    }
    if (!user.avatarColor) {
      user.avatarColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
      console.warn('User missing avatarColor, using:', user.avatarColor);
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log('Calling sessionService.createSession with user:', user);
      
      // Make sure we're not already connected or connecting
      if (isConnected || webSocketService.isConnectingToSession()) {
        console.log('Disconnecting from any existing sessions before creating a new one');
        webSocketService.disconnect();
        // Small delay to ensure disconnection completes
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Try to create the session with timeout
      const sessionPromise = sessionService.createSession(user);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Session creation timed out')), 10000);
      });
      
      const session = await Promise.race([sessionPromise, timeoutPromise]);
      
      console.log('Session created successfully:', session);
      
      if (!session) {
        console.error('Session creation failed: Session is null');
        setError('Failed to create session: Unknown error');
        setIsConnecting(false);
        return '';
      }
      
      if (!session.id || session.id.trim() === '') {
        console.error('Session created but missing or invalid ID!');
        setError('Failed to create session: Invalid session ID');
        setIsConnecting(false);
        return '';
      }
      
      // Explicitly log the session ID for debugging
      const sessionId = session.id;
      console.log('*** Session ID from created session:', sessionId);
      
      setCurrentSession(session);
      setIsConnecting(false);
      
      // Double check the session ID one more time before returning
      if (!sessionId || sessionId.trim() === '') {
        console.error('Final check: Session ID is still empty or invalid');
        setError('Failed to create session: Invalid session ID in final check');
        return '';
      }
      
      return sessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to create session:', errorMessage);
      setError(`Failed to create session: ${errorMessage}`);
      setIsConnecting(false);
      
      // Always make sure to clean up any connection attempts
      webSocketService.disconnect();
      
      return '';
    }
  };

  // Join an existing session
  const joinSession = async (sessionId: string): Promise<boolean> => {
    console.log('Attempting to join session:', sessionId, 'Current session:', currentSession?.id);
    
    // Check if we're already connected to this session
    if (isConnected && currentSession && currentSession.id === sessionId) {
      console.log('Already connected to session, skipping join process');
      return true;
    }

    // Check if we're already trying to join this session
    if (joiningSessionRef.current === sessionId) {
      console.log('Already joining this session, returning existing promise');
      return new Promise((resolve) => {
        // Check connection status periodically
        const checkInterval = setInterval(() => {
          if (isConnected && currentSession?.id === sessionId) {
            clearInterval(checkInterval);
            resolve(true);
          } else if (joiningSessionRef.current !== sessionId) {
            // Join attempt was canceled or changed
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 100);
        
        // Add a timeout to avoid infinite waiting
        setTimeout(() => {
          clearInterval(checkInterval);
          if (joiningSessionRef.current === sessionId) {
            console.log('Join session timed out after waiting');
            joiningSessionRef.current = null;
          }
          resolve(false);
        }, 10000); // 10 second timeout
      });
    }

    if (!authState.user) {
      console.error('Cannot join session: User not authenticated');
      setError('You must be logged in to join a session');
      return false;
    }
    
    // Force disconnect from any existing session first to avoid connection conflicts
    if (isConnected && currentSession && currentSession.id !== sessionId) {
      console.log('Disconnecting from current session before joining new one');
      webSocketService.disconnect();
      // Small delay to ensure disconnection completes
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Set joining flag with this session ID
    joiningSessionRef.current = sessionId;
    setIsConnecting(true);
    setError(null);
    
    try {
      // Set a flag to avoid notification loops during the join process
      const isRejoining = sessionRef.current?.id === sessionId;
      
      const session = await sessionService.joinSession(sessionId, authState.user);
      
      if (!session || !session.id) {
        throw new Error('Invalid session data received');
      }
      
      setCurrentSession(session);
      setIsConnecting(false);
      
      // Log that we successfully joined
      console.log('Successfully joined session:', session.id, 
                  'isRejoining:', isRejoining);
      
      // Clear joining flag since we've successfully joined
      joiningSessionRef.current = null;
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to join session:', errorMessage);
      setError(`Failed to join session: ${errorMessage}`);
      setIsConnecting(false);
      // Clear joining flag since the attempt failed
      joiningSessionRef.current = null;
      return false;
    }
  };

  // Leave the current session
  const leaveSession = (shouldNavigate: boolean = true) => {
    console.log('Leaving session...', {shouldNavigate});
    
    // Set navigating flag if we're going to navigate
    if (shouldNavigate) {
      navigatingRef.current = true;
    }
    
    if (!isConnected) {
      console.log('Not connected, skipping leaveSession');
      return;
    }
    
    // Cancel any active join operation
    joiningSessionRef.current = null;
    
    // Leave the session
    sessionService.leaveSession();
    
    // Clear the current session
    setCurrentSession(null);
    
    if (shouldNavigate) {
      console.log('Navigating to home after leaving session');
      navigate('/');
    } else {
      console.log('Not navigating after leaving session (as requested)');
    }
  };

  // Get shareable link for a session
  const getShareableLink = (sessionId: string): string => {
    return sessionService.getShareableLink(sessionId);
  };

  // Get sessions for the current user
  const getSessionsForUser = async (): Promise<Session[]> => {
    try {
      const savedSessions = sessionService.getSavedSessions();
      return Promise.resolve(savedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return Promise.resolve([]);
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      sessionService.deleteSession(sessionId);
      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        participants,
        isConnected,
        isConnecting,
        error,
        createSession,
        joinSession,
        leaveSession,
        getShareableLink,
        getSessionsForUser,
        deleteSession
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);

export default SessionContext; 