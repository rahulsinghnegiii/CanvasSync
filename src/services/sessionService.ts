import { v4 as uuidv4 } from 'uuid';
import type { WhiteboardSession, User } from '../types';
import webSocketService from './webSocketService';

// This service handles session creation, joining, and management
class SessionService {
  private storageKey = 'whiteboard_sessions';
  private activeSessionId: string | null = null;

  // Create a new session
  async createSession(user: User): Promise<WhiteboardSession> {
    try {
      console.log('SessionService.createSession called with user:', user);
      
      if (!user) {
        console.error('Cannot create session: User is null or undefined');
        throw new Error('User is required to create a session');
      }
      
      // Ensure user has required properties
      const safeUser: User = {
        username: user.username || 'Guest_' + Date.now().toString().slice(-4),
        avatarColor: user.avatarColor || '#' + Math.floor(Math.random() * 16777215).toString(16),
        ...user
      };
      
      // Generate a unique session ID
      // Direct approach without using uuid library to ensure reliable ID generation
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      console.log('Generated session ID directly:', sessionId);
      
      if (!sessionId || sessionId.trim() === '') {
        console.error('Failed to generate valid session ID');
        throw new Error('Failed to generate valid session ID');
      }
      
      console.log('Using session ID:', sessionId);
      
      const session: WhiteboardSession = {
        id: sessionId,
        name: `Session ${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        createdBy: safeUser.username,
        participants: [safeUser]
      };
      
      console.log('Created session object:', session);

      // Store in localStorage
      this.saveSession(session);
      console.log('Saved session to localStorage');
      
      // Set as active session
      this.activeSessionId = sessionId;
      
      // Connect to WebSocket for this session - with retry logic
      console.log('Connecting to WebSocket...');
      let connected = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!connected && attempts < maxAttempts) {
        attempts++;
        console.log(`WebSocket connection attempt ${attempts}/${maxAttempts}`);
        
        try {
          connected = await webSocketService.connect(sessionId, safeUser);
          if (connected) {
            console.log('WebSocket connection established for session:', sessionId);
            break;
          } else {
            console.warn(`WebSocket connection failed on attempt ${attempts}`);
            // Add a small delay before retry
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (connError) {
          console.error(`WebSocket connection error on attempt ${attempts}:`, connError);
          // Continue to next attempt
        }
      }
      
      if (!connected) {
        console.error(`Failed to connect to WebSocket after ${maxAttempts} attempts`);
        throw new Error('Failed to connect to WebSocket for session');
      }
      
      return session;
    } catch (error) {
      console.error('Error in createSession:', error);
      this.activeSessionId = null; // Reset active session ID on error
      throw error;
    }
  }

  // Join an existing session
  async joinSession(sessionId: string, user: User): Promise<WhiteboardSession> {
    console.log('SessionService.joinSession called:', { sessionId, user });
    
    // Sanitize the session ID (remove any path or query parameters)
    const cleanSessionId = sessionId.split('/').pop()?.split('?')[0] || sessionId;
    console.log('Sanitized session ID:', cleanSessionId);
    
    // Check if we're already in this session
    if (this.activeSessionId === cleanSessionId && webSocketService.isConnectedToSession()) {
      console.log('Already in this session, reusing existing connection');
      const existingSession = this.getSavedSessions().find(s => s.id === cleanSessionId);
      if (existingSession) {
        return existingSession;
      }
    }
    
    // Check if we're already connecting
    if (webSocketService.isConnectingToSession()) {
      console.log('Already connecting to a session, will disconnect first');
      webSocketService.disconnect();
      // Small delay to ensure disconnect completes
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Set this as the active session
    this.activeSessionId = cleanSessionId;
    
    // In a real app, we'd fetch session details from a server
    // For now, we'll create a session object or use an existing one from localStorage
    let session = this.getSavedSessions().find(s => s.id === cleanSessionId);
    
    if (!session) {
      console.log('Session not found in localStorage, creating new session object');
      session = {
        id: cleanSessionId,
        name: `Session ${cleanSessionId.substring(0, 8)}`,
        createdAt: new Date().toISOString(),
        createdBy: 'unknown', // In a real app, we'd get this from the server
        participants: [user]
      };
    } else {
      console.log('Found existing session in localStorage:', session.id);
      
      // Update participants if needed
      if (!session.participants.some(p => p.username === user.username)) {
        session.participants.push(user);
      }
    }

    // Store in localStorage
    this.saveSession(session);
    console.log('Saved/updated session to localStorage');
    
    // Connect to WebSocket for this session
    console.log('Connecting to WebSocket for session:', cleanSessionId);
    try {
      await webSocketService.connect(cleanSessionId, user);
      console.log('WebSocket connection established for session:', cleanSessionId);
      return session;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      throw new Error(`Failed to connect to session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Leave the current session
  leaveSession(): void {
    console.log('SessionService.leaveSession called');
    
    // Clear active session
    this.activeSessionId = null;
    
    // Disconnect WebSocket
    webSocketService.disconnect();
    
    console.log('Session left successfully');
  }

  // Delete a session
  deleteSession(sessionId: string): void {
    console.log('SessionService.deleteSession called:', sessionId);
    
    // If we're deleting the active session, leave it first
    if (this.activeSessionId === sessionId) {
      this.leaveSession();
    }
    
    const sessions = this.getSavedSessions();
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(this.storageKey, JSON.stringify(updatedSessions));
    
    console.log('Session deleted from localStorage:', sessionId);
  }

  // Save session to localStorage
  private saveSession(session: WhiteboardSession): void {
    const sessions = this.getSavedSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex !== -1) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(sessions));
  }

  // Get all saved sessions
  getSavedSessions(): WhiteboardSession[] {
    const sessionsJson = localStorage.getItem(this.storageKey);
    return sessionsJson ? JSON.parse(sessionsJson) : [];
  }

  // Get current session info
  getCurrentSession(): WhiteboardSession | null {
    const sessionId = webSocketService.getSessionId();
    if (!sessionId) return null;
    
    const sessions = this.getSavedSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  // Get active session ID
  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  // Generate a shareable link for a session
  getShareableLink(sessionId: string): string {
    if (!sessionId) {
      console.error('Cannot generate shareable link: Session ID is empty');
      return `${window.location.origin}/whiteboard`;
    }
    
    // Clean the session ID to avoid any encoding issues
    const cleanSessionId = sessionId.split('/').pop()?.split('?')[0] || sessionId;
    
    // Make sure the URL is properly formed with the clean session ID
    const shareableUrl = `${window.location.origin}/whiteboard/${cleanSessionId}`;
    console.log('Generated shareable link:', shareableUrl);
    
    return shareableUrl;
  }
}

export default new SessionService(); 