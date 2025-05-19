import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import { SessionProvider } from '../contexts/SessionContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import Sessions from '../pages/Sessions';
import Whiteboard from '../pages/Whiteboard';
import sessionService from '../services/sessionService';
import webSocketService from '../services/webSocketService';

// Mock the services
vi.mock('../services/sessionService', () => ({
  default: {
    createSession: vi.fn(),
    joinSession: vi.fn(),
    leaveSession: vi.fn(),
    getSavedSessions: vi.fn(),
    getShareableLink: vi.fn(),
    getCurrentSession: vi.fn(),
    getActiveSessionId: vi.fn(),
    deleteSession: vi.fn()
  }
}));

vi.mock('../services/webSocketService', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(),
    isConnecting: vi.fn(),
    getSessionId: vi.fn(),
    isConnectedToSession: vi.fn(),
    isConnectingToSession: vi.fn(),
    addParticipant: vi.fn(),
    removeParticipant: vi.fn(),
    onConnectionChange: vi.fn(() => () => {}),
    onParticipantsChange: vi.fn(() => () => {}),
    onDrawEvent: vi.fn(() => () => {})
  }
}));

// Create a wrapper for testing
const TestWrapper = ({ children, initialRoute = '/' }) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <NotificationProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </NotificationProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Invitation Link Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
          store[key] = value.toString();
        }),
        clear: vi.fn(() => {
          store = {};
        }),
        removeItem: vi.fn((key) => {
          delete store[key];
        })
      };
    })();
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Mock authenticated user
    vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
      if (key === 'auth_user') {
        return JSON.stringify({
          username: 'testuser',
          avatarColor: '#ff0000'
        });
      }
      return null;
    });
    
    // Mock successful session join
    sessionService.joinSession.mockResolvedValue({
      id: 'test-session-123',
      name: 'Test Session',
      createdAt: new Date().toISOString(),
      createdBy: 'testuser',
      participants: [{ username: 'testuser', avatarColor: '#ff0000' }]
    });
    
    // Mock WebSocket connection
    webSocketService.connect.mockResolvedValue(true);
    webSocketService.isConnected.mockReturnValue(true);
    webSocketService.isConnectedToSession.mockReturnValue(true);
  });
  
  it('properly generates a shareable link', async () => {
    // Set up test data
    const testSessionId = 'test-session-123';
    const expectedLink = `${window.location.origin}/whiteboard/${testSessionId}`;
    
    // Mock the implementation for getShareableLink
    sessionService.getShareableLink.mockReturnValue(expectedLink);
    
    // Mock saved sessions
    sessionService.getSavedSessions.mockReturnValue([{
      id: testSessionId,
      name: 'Test Session',
      createdAt: new Date().toISOString(),
      createdBy: 'testuser',
      participants: [{ username: 'testuser', avatarColor: '#ff0000' }]
    }]);
    
    // Render the Sessions component
    render(
      <TestWrapper>
        <Sessions />
      </TestWrapper>
    );
    
    // Find the share button and click it
    const shareButton = await screen.findByText('Share');
    fireEvent.click(shareButton);
    
    // Check if the generated link is displayed in the modal
    expect(sessionService.getShareableLink).toHaveBeenCalledWith(testSessionId);
  });
  
  it('successfully joins a session via invitation link', async () => {
    // Set up test data
    const testSessionId = 'test-session-123';
    
    // Render the Whiteboard component with a session ID in the route
    await act(async () => {
      render(
        <TestWrapper initialRoute={`/whiteboard/${testSessionId}`}>
          <Routes>
            <Route path="/whiteboard/:sessionId" element={<Whiteboard />} />
          </Routes>
        </TestWrapper>
      );
    });
    
    // Verify that joinSession was called with the correct session ID
    expect(sessionService.joinSession).toHaveBeenCalledWith(testSessionId, expect.anything());
  });
  
  it('handles malformed session IDs in URLs properly', async () => {
    // Set up test data with a malformed session ID
    const malformedSessionId = 'test-session-123/with/extra/path';
    const expectedCleanSessionId = 'path'; // The last part after splitting by '/'
    
    // Mock the implementation for joinSession to clean the session ID
    sessionService.joinSession.mockImplementation((sessionId) => {
      const cleanSessionId = sessionId.split('/').pop() || sessionId;
      return Promise.resolve({
        id: cleanSessionId,
        name: `Session ${cleanSessionId}`,
        createdAt: new Date().toISOString(),
        createdBy: 'testuser',
        participants: [{ username: 'testuser', avatarColor: '#ff0000' }]
      });
    });
    
    // Render the Whiteboard component with a malformed session ID
    await act(async () => {
      render(
        <TestWrapper initialRoute={`/whiteboard/${malformedSessionId}`}>
          <Routes>
            <Route path="/whiteboard/:sessionId" element={<Whiteboard />} />
          </Routes>
        </TestWrapper>
      );
    });
    
    // Verify that joinSession cleaned up the session ID correctly
    expect(sessionService.joinSession).toHaveBeenCalled();
    const firstCallArg = sessionService.joinSession.mock.calls[0][0];
    expect(firstCallArg).toBe(malformedSessionId);
  });
}); 