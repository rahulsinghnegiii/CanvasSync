import { describe, it, expect, vi, beforeEach } from 'vitest';
import sessionService from './sessionService';
import webSocketService from './webSocketService';

// Mock dependencies
vi.mock('./webSocketService', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn(),
    isConnectedToSession: vi.fn().mockReturnValue(false),
    isConnectingToSession: vi.fn().mockReturnValue(false)
  }
}));

// Mock Date.now() to return a consistent value
const MOCK_DATE_NOW = 1621234567890;
vi.spyOn(Date, 'now').mockImplementation(() => MOCK_DATE_NOW);

// Mock Math.random() for consistent IDs
const MOCK_RANDOM = 0.123456789;
vi.spyOn(Math, 'random').mockImplementation(() => MOCK_RANDOM);

describe('SessionService', () => {
  let localStorageMock: { [key: string]: any };
  
  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Mock Date for consistent timestamps
    const mockDate = new Date('2025-05-18T17:29:44.219Z');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    
    // Clear mocks between tests
    vi.clearAllMocks();

    // Mock WebSocket connection
    webSocketService.connect.mockResolvedValue(true);
    webSocketService.isConnected.mockReturnValue(true);
    webSocketService.isConnectedToSession.mockReturnValue(true);
    webSocketService.addParticipant = vi.fn(); // Use the new participant function instead of mock
  });

  it('should create a new session', async () => {
    const mockUser = { username: 'testUser', avatarColor: '#FF0000' };
    // Expected session ID from our direct generation
    const expectedSessionId = `session-${MOCK_DATE_NOW}-${MOCK_RANDOM.toString(36).substring(2, 9)}`;
    
    const session = await sessionService.createSession(mockUser);
    
    // Verify session object structure
    expect(session).toEqual({
      id: expectedSessionId,
      name: expect.any(String),
      createdAt: expect.any(String),
      createdBy: mockUser.username,
      participants: [expect.objectContaining(mockUser)]
    });
    
    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Verify WebSocket connection was established
    expect(webSocketService.connect).toHaveBeenCalledWith(expectedSessionId, mockUser);
  });

  it('should generate a shareable link for a session', () => {
    const sessionId = 'test-session-123';
    const link = sessionService.getShareableLink(sessionId);
    
    // Verify link format (should include origin and sessionId)
    expect(link).toContain(sessionId);
    expect(link).toContain(`${window.location.origin}/whiteboard/`);
  });

  it('should handle user with missing username when creating session', async () => {
    // Setup mock implementation that provides username in the safeUser object
    const mockUser = { avatarColor: '#FF0000' } as any; // Missing username intentionally
    
    // Use a default Guest name pattern
    const expectedPattern = /Guest_\d{4}/;
    
    const session = await sessionService.createSession(mockUser);
    
    // Verify session creates a username when missing
    expect(session.createdBy).toMatch(expectedPattern);
  });
  
  it('should throw an error when WebSocket connection fails', async () => {
    // Mock WebSocket connection failure
    (webSocketService.connect as jest.Mock).mockResolvedValueOnce(false);
    
    const mockUser = { username: 'testUser', avatarColor: '#FF0000' };
    
    // Test should reject with the appropriate error
    await expect(sessionService.createSession(mockUser))
      .rejects
      .toThrow('Failed to connect to WebSocket for session');
  });
}); 