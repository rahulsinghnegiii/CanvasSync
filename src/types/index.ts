// User related types
export interface User {
  id?: string;
  username: string;
  avatarColor?: string;
}

// Whiteboard related types
export interface WhiteboardSession {
  id: string;
  name?: string;
  createdAt: string;
  createdBy: string;
  participants: User[];
}

// Canvas related types
export interface Point {
  x: number;
  y: number;
}

export interface DrawingElement {
  id: string;
  type: 'brush' | 'eraser' | 'shape' | 'text' | 'image';
  points?: Point[];
  color?: string;
  size?: number;
  text?: string;
  imageUrl?: string;
  createdBy: string;
  timestamp: number;
}

// Authentication related types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
  loading: boolean;
}

// WebSocket related types
export interface WebSocketMessage {
  type: 'drawing' | 'cursor' | 'chat' | 'presence';
  payload: any;
  sessionId: string;
  userId: string;
  timestamp: number;
}

// ML Classification mock types
export interface ImageClassification {
  image: string;
  prediction: string;
  confidence: number;
} 