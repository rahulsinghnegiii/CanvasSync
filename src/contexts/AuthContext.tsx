import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState } from '../types';
import authService from '../services/authService';

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  error: null,
  loading: true
};

// Create context
const AuthContext = createContext<{
  authState: AuthState;
  login: (username: string, password: string, customColor?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (user: Partial<User>) => Promise<void>;
}>({
  authState: initialState,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {}
});

// Authentication provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  // Check for existing user session on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const user = authService.getCurrentUser();
        setAuthState({
          isAuthenticated: !!user,
          user,
          error: null,
          loading: false
        });
      } catch (error) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          error: 'Session expired or invalid',
          loading: false
        });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (username: string, password: string, customColor?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const user = await authService.login(username, password, customColor);
      setAuthState({
        isAuthenticated: true,
        user,
        error: null,
        loading: false
      });
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        error: error instanceof Error ? error.message : 'Login failed',
        loading: false
      });
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await authService.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        error: null,
        loading: false
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Logout failed',
        loading: false
      }));
    }
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const updatedUser = await authService.updateProfile(userData);
      setAuthState({
        isAuthenticated: true,
        user: updatedUser,
        error: null,
        loading: false
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Profile update failed',
        loading: false
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 