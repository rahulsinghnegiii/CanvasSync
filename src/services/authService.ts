import type { User } from '../types';

// This is a temporary mock service that will be replaced with Keycloak integration
class AuthService {
  // Mock login function
  async login(username: string, password: string, customColor?: string): Promise<User> {
    // In a real implementation, this would validate with Keycloak
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    // Use custom color if provided, otherwise generate a random one
    const avatarColor = customColor || this.getRandomColor();
    
    // Create a mock user object
    const user: User = {
      username,
      avatarColor
    };

    // Store in localStorage for persistence (temporary solution)
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  }

  // Mock logout function
  async logout(): Promise<void> {
    // In a real implementation, this would logout from Keycloak
    localStorage.removeItem('user');
  }

  // Get current user from local storage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr) as User;
      
      // Ensure user object is complete with required properties
      if (!user.username) {
        console.warn('User object missing username, using default');
        user.username = 'Guest User';
      }
      
      if (!user.avatarColor) {
        console.warn('User object missing avatarColor, using default');
        user.avatarColor = this.getRandomColor();
      }
      
      return user;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      this.logout();
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Update user profile
  async updateProfile(user: Partial<User>): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const updatedUser: User = {
      ...currentUser,
      ...user
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  }

  // Generate a random color for user avatar/cursor
  private getRandomColor(): string {
    const colors = [
      '#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3',
      '#33FFF3', '#F333FF', '#FF3333', '#33FF33', '#3333FF'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export default new AuthService(); 