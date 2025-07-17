// Auth0 implementation for admin authentication
// Auth0 application: alberguedelcarrascalejo
// Domain: alberguedelcarrascalejo.eu.auth0.com
// Client ID: 7nUX3uw17WJB05C1o1XxJhSwKVMTbo3
// Client Secret: 3rzO32cU5r170g_CEI8o152FqefNMYsJ5mpqn2o6W8dtzjbSyGQ

interface Auth0User {
  email: string;
  name: string;
  sub: string;
  email_verified: boolean;
}

interface Auth0Config {
  domain: string;
  clientId: string;
  redirectUri: string;
}

class MockAuth0 {
  private config: Auth0Config;
  private user: Auth0User | null = null;
  private isAuthenticated = false;

  constructor(config: Auth0Config) {
    this.config = config;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const storedUser = localStorage.getItem('auth0_user');
    const storedAuth = localStorage.getItem('auth0_authenticated');
    
    if (storedUser && storedAuth === 'true') {
      this.user = JSON.parse(storedUser);
      this.isAuthenticated = true;
    }
  }

  private saveToStorage(): void {
    if (this.user) {
      localStorage.setItem('auth0_user', JSON.stringify(this.user));
      localStorage.setItem('auth0_authenticated', 'true');
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('auth0_user');
    localStorage.removeItem('auth0_authenticated');
  }

  async loginWithRedirect(): Promise<void> {
    // Simulate Auth0 login flow
    return new Promise((resolve) => {
      const email = prompt('Enter admin email:');
      const password = prompt('Enter admin password:');
      
      // Mock validation - in real Auth0, this would be handled by their servers
      if (email === 'admin@alberguedelcarrascalejo.com' && password === 'albergue2025!') {
        this.user = {
          email: email,
          name: 'Albergue Administrator',
          sub: 'auth0|mock-user-id',
          email_verified: true
        };
        this.isAuthenticated = true;
        this.saveToStorage();
        
        // Simulate redirect back to application
        setTimeout(() => {
          window.location.href = '/admin';
          resolve();
        }, 1000);
      } else {
        alert('Invalid credentials. Use admin@alberguedelcarrascalejo.com / albergue2025!');
        resolve();
      }
    });
  }

  async logout(): Promise<void> {
    this.user = null;
    this.isAuthenticated = false;
    this.clearStorage();
    
    // Simulate Auth0 logout redirect
    window.location.href = '/';
  }

  async getUser(): Promise<Auth0User | null> {
    return this.user;
  }

  async isAuthenticatedAsync(): Promise<boolean> {
    return this.isAuthenticated;
  }

  async getAccessTokenSilently(): Promise<string> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }
    
    // Generate a mock JWT token
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: this.user?.sub,
      email: this.user?.email,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      iat: Math.floor(Date.now() / 1000),
      aud: this.config.clientId
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  }
}

// Mock Auth0 configuration based on the provided screenshot
const auth0Config: Auth0Config = {
  domain: 'alberguedelcarrascalejo.eu.auth0.com',
  clientId: '7nUX3uw17WJB05C1o1XxJhSwKVMTbo3',
  redirectUri: window.location.origin + '/admin'
};

export const auth0 = new MockAuth0(auth0Config);
export type { Auth0User };