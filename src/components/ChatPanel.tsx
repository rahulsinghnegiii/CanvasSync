import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import webSocketService from '../services/webSocketService';
import type { WebSocketMessage } from '../types';

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  isSystem?: boolean;
}

const ChatPanel: React.FC = () => {
  const { authState } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for chat messages from WebSocket
  useEffect(() => {
    const unsubscribe = webSocketService.onMessage((message: WebSocketMessage) => {
      if (message.type === 'chat') {
        const { text, sender, isSystem } = message.payload;
        
        setMessages(prev => [
          ...prev,
          {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            text,
            sender: isSystem ? 'System' : sender || message.userId,
            timestamp: message.timestamp,
            isSystem
          }
        ]);
      }
    });
    
    return unsubscribe;
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !authState.user) return;
    
    webSocketService.sendChatMessage(newMessage);
    setNewMessage('');
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isExpanded) {
    return (
      <div className="chat-panel-collapsed">
        <button 
          className="btn btn-primary"
          onClick={() => setIsExpanded(true)}
        >
          Open Chat
        </button>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h4>Chat</h4>
        <button 
          className="btn btn-sm btn-icon"
          onClick={() => setIsExpanded(false)}
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        )}
        
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`chat-message ${
              message.isSystem 
                ? 'system-message' 
                : message.sender === authState.user?.username 
                  ? 'own-message' 
                  : 'other-message'
            }`}
          >
            {!message.isSystem && (
              <div className="message-header">
                <span className="sender-name">{message.sender}</span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            )}
            <div className="message-text">{message.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form 
        onSubmit={handleSendMessage}
        className="chat-input"
      >
        <input
          type="text"
          className="form-control"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPanel; 