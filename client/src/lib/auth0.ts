// Mock Auth0 service for development
class Auth0Service {
  async loginWithRedirect() {
    // Mock implementation - would redirect to Auth0 in production
    console.log('Mock Auth0 login redirect');
    
    // For development, simulate a login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would redirect to Auth0
    // For now, just navigate to admin
    window.location.href = '/admin';
  }

  async getUser() {
    // Mock user for development
    return {
      name: 'Admin User',
      email: 'admin@carrascalejo.com',
      role: 'admin'
    };
  }

  async logout() {
    console.log('Mock Auth0 logout');
    window.location.href = '/';
  }

  isAuthenticated() {
    // Mock authentication check
    return false;
  }
}

export const auth0Service = new Auth0Service();