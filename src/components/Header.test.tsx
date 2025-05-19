import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import AuthContext from '../contexts/AuthContext';

// Mock the useNavigate hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Header Component', () => {
  // Test with unauthenticated user
  it('renders login button when user is not authenticated', () => {
    const mockAuthContext = {
      authState: {
        isAuthenticated: false,
        user: null,
        error: null,
        loading: false,
      },
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Header title="Test Title" />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check if the title is rendered
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    
    // Check if login button is rendered
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // Navigation menu items should not be rendered
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('My Sessions')).not.toBeInTheDocument();
  });

  // Test with authenticated user
  it('renders user profile when user is authenticated', () => {
    const mockAuthContext = {
      authState: {
        isAuthenticated: true,
        user: {
          username: 'TestUser',
          avatarColor: '#FF5733',
        },
        error: null,
        loading: false,
      },
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Header title="Test Title" />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check if navigation menu items are rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    // For "My Sessions" which appears multiple times, use getAllByText
    const mySessionsElements = screen.getAllByText('My Sessions');
    expect(mySessionsElements.length).toBeGreaterThan(0);
    
    // Check if username is rendered
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  // Test with authenticated user but missing username
  it('handles missing username gracefully', () => {
    const mockAuthContext = {
      authState: {
        isAuthenticated: true,
        user: {
          // Username intentionally missing
          avatarColor: '#FF5733',
        },
        error: null,
        loading: false,
      },
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Header title="Test Title" />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check if default user text is shown
    expect(screen.getByText('User')).toBeInTheDocument();
    
    // Check if the avatar contains a question mark
    expect(screen.getByText('?')).toBeInTheDocument();
  });
}); 