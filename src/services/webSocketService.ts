import type { WebSocketMessage, User } from '../types';

// This is a mock WebSocket service that simulates real-time collaboration
// In a real implementation, this would connect to a WebSocket server
class WebSocketService {
  private socket: WebSocket | null = null;
  private sessionId: string | null = null;
  private user: User | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private participantHandlers: ((participants: User[]) => void)[] = [];
  private mockParticipants: User[] = [];
  private isConnected: boolean = false;
  private reconnectTimeout: number | null = null;
  // Add a flag to track if we're in the process of connecting
  private isConnecting: boolean = false;
  // Track connection request to handle race conditions
  private connectionRequest: { sessionId: string, timestamp: number } | null = null;

  // Connect to WebSocket server
  connect(sessionId: string, user: User): Promise<boolean> {
    console.log('WebSocketService.connect called with:', { sessionId, user });

    // Validate inputs
    if (!sessionId) {
      console.error('WebSocketService.connect: Missing sessionId');
      return Promise.resolve(false);
    }
    
    if (!user) {
      console.error('WebSocketService.connect: Missing user object');
      return Promise.resolve(false);
    }
    
    // Ensure sessionId is a string and not empty
    if (typeof sessionId !== 'string' || sessionId.trim() === '') {
      console.error('WebSocketService.connect: Invalid sessionId format');
      return Promise.resolve(false);
    }
    
    // Check if already connected to this session
    if (this.isConnected && this.sessionId === sessionId) {
      console.log('Already connected to this session, reusing connection');
      return Promise.resolve(true);
    }
    
    // Check if currently connecting
    if (this.isConnecting) {
      console.log('Already in the process of connecting');
      
      // If connecting to the same session, wait for that connection
      if (this.connectionRequest && this.connectionRequest.sessionId === sessionId) {
        console.log('Already connecting to this session, waiting for that connection');
        return new Promise((resolve) => {
          // Check connection status periodically
          const checkInterval = setInterval(() => {
            if (this.isConnected && this.sessionId === sessionId) {
              clearInterval(checkInterval);
              resolve(true);
            } else if (!this.isConnecting) {
              // Connection attempt finished but we're not connected
              clearInterval(checkInterval);
              resolve(false);
            }
          }, 100);
          
          // Add timeout to prevent infinite waiting
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!this.isConnected) {
              console.log('Connection attempt timed out');
              this.isConnecting = false;
              resolve(false);
            }
          }, 5000);
        });
      }
      
      // If connecting to a different session, disconnect first
      console.log('Connecting to a different session, disconnecting current connection attempt');
      this.disconnect();
    }
    
    // If connected to a different session, disconnect first
    if (this.isConnected) {
      console.log('Disconnecting from existing session before connecting to new one');
      this.disconnect();
    }
    
    // Create a copy with defaults for missing properties
    const safeUser: User = {
      username: user.username || `Guest_${Date.now().toString().slice(-4)}`,
      avatarColor: user.avatarColor || '#' + Math.floor(Math.random() * 16777215).toString(16),
      ...user
    };

    // Set connecting flag
    this.isConnecting = true;
    // Save this connection request
    this.connectionRequest = {
      sessionId,
      timestamp: Date.now()
    };

    return new Promise((resolve) => {
      try {
        // Store the requested session ID to check for race conditions
        const requestTimestamp = this.connectionRequest?.timestamp;
        
        this.sessionId = sessionId;
        this.user = safeUser;
        
        // Initialize with just the current user instead of adding mock participants
        this.mockParticipants = [safeUser];
        
        // Simulate WebSocket connection - always succeed in demo mode
        console.log('Starting simulated WebSocket connection for session:', sessionId);
        setTimeout(() => {
          // Make sure we're still trying to connect to the same session
          if (!this.connectionRequest || 
              this.connectionRequest.sessionId !== sessionId || 
              this.connectionRequest.timestamp !== requestTimestamp) {
            console.log('Connection request superseded by a newer request, aborting');
            this.isConnecting = false;
            resolve(false);
            return;
          }
          
          // Update connection state
          this.isConnected = true;
          this.isConnecting = false;
          
          console.log('WebSocket connection established, notifying handlers');
          // Notify connection handlers
          this.connectionHandlers.forEach(handler => handler(true));
          
          // Notify participant handlers with real user data
          this.participantHandlers.forEach(handler => handler([...this.mockParticipants]));
          
          console.log('WebSocket connection complete with session ID:', sessionId);
          resolve(true);
        }, 500);
      } catch (err) {
        console.error('Error in WebSocket connection process:', err);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    console.log('WebSocketService.disconnect called');
    
    if (!this.isConnected && !this.isConnecting) {
      console.log('Not connected or connecting, nothing to disconnect');
      return;
    }
    
    // Clear reconnect timeout if exists
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Clear connection request
    this.connectionRequest = null;
    
    // Reset flags
    this.isConnected = false;
    this.isConnecting = false;
    
    // Notify handlers
    this.connectionHandlers.forEach(handler => handler(false));
    
    // Clear session data
    this.sessionId = null;
    this.user = null;
    this.mockParticipants = [];
    
    console.log('WebSocket disconnected');
  }
  
  // Add a real participant (for actual use)
  addParticipant(user: User): void {
    if (!this.isConnected) return;
    
    // Check if user already exists
    const existingIndex = this.mockParticipants.findIndex(
      p => p.username === user.username
    );
    
    if (existingIndex !== -1) {
      // Update existing user data if it changed
      this.mockParticipants[existingIndex] = {
        ...this.mockParticipants[existingIndex],
        ...user
      };
    } else {
      // Add new user
      this.mockParticipants.push({...user});
      
      // Notify system of new user
      this.notifySystemMessage(`${user.username} has joined the session`);
    }
    
    // Notify participant handlers
    this.participantHandlers.forEach(handler => handler([...this.mockParticipants]));
  }
  
  // Remove a participant
  removeParticipant(username: string): void {
    if (!this.isConnected) return;
    
    const index = this.mockParticipants.findIndex(p => p.username === username);
    if (index !== -1) {
      this.mockParticipants.splice(index, 1);
      this.participantHandlers.forEach(handler => handler([...this.mockParticipants]));
      
      // Notify with a system message
      this.notifySystemMessage(`${username} has left the session`);
    }
  }

  // Send a message through WebSocket
  sendMessage(type: string, payload: any): void {
    if (!this.isConnected || !this.sessionId || !this.user) return;
    
    const message: WebSocketMessage = {
      type: type as any,
      payload,
      sessionId: this.sessionId,
      userId: this.user?.username || 'unknown',
      timestamp: Date.now()
    };
    
    // For simulation purposes, echo the message back after a small delay
    setTimeout(() => {
      this.messageHandlers.forEach(handler => handler(message));
    }, 100);
  }
  
  // Send drawing data
  sendDrawingData(lineData: any): void {
    this.sendMessage('drawing', lineData);
  }
  
  // Send cursor position
  sendCursorPosition(position: { x: number, y: number }): void {
    this.sendMessage('cursor', position);
  }
  
  // Send chat message
  sendChatMessage(message: string): void {
    this.sendMessage('chat', { text: message, sender: this.user?.username });
  }
  
  // Notify with a system message
  notifySystemMessage(message: string): void {
    const systemMessage: WebSocketMessage = {
      type: 'chat',
      payload: { text: message, isSystem: true },
      sessionId: this.sessionId || '',
      userId: 'system',
      timestamp: Date.now()
    };
    
    this.messageHandlers.forEach(handler => handler(systemMessage));
  }

  // Register a message handler
  onMessage(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }
  
  // Register a connection state handler
  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler);
    // Call immediately with current state
    handler(this.isConnected);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }
  
  // Register a participants handler
  onParticipantsChange(handler: (participants: User[]) => void): () => void {
    this.participantHandlers.push(handler);
    
    // Use setTimeout to prevent potential update loop by deferring initial call
    if (this.isConnected) {
      // Add a small delay to prevent rapid-fire notifications
      setTimeout(() => {
        // Check if handler is still registered before calling
        if (this.participantHandlers.includes(handler)) {
          // Make a deep copy of the participants to prevent reference issues
          const participantsCopy = JSON.parse(JSON.stringify(this.mockParticipants));
          handler(participantsCopy);
        }
      }, 100); // Increased from 0ms to 100ms for better debouncing
    }
    
    return () => {
      this.participantHandlers = this.participantHandlers.filter(h => h !== handler);
    };
  }
  
  // Get current session ID
  getSessionId(): string | null {
    return this.sessionId;
  }
  
  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }
  
  // Get current participants
  getParticipants(): User[] {
    return this.mockParticipants;
  }
  
  // Check if connected
  isConnectedToSession(): boolean {
    return this.isConnected;
  }
  
  // Check if currently connecting
  isConnectingToSession(): boolean {
    return this.isConnecting;
  }
}

export default new WebSocketService(); 