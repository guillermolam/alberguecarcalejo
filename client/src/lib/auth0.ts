import { Auth0Client } from '@auth0/auth0-spa-js';

const auth0Config = {
  domain: 'alberguedelcarrascalejo.eu.auth0.com',
  clientId: '7nUX3uw17WJB05C1o1XxJhSwKVMTbo3',
  authorizationParams: {
    redirect_uri: window.location.origin + '/admin',
    audience: 'https://albergue-api.com',
    scope: 'openid profile email read:admin write:admin'
  },
  cacheLocation: 'localstorage',
  useRefreshTokens: true
};

export const auth0 = new Auth0Client(auth0Config);

export interface Auth0User {
  email: string;
  name: string;
  sub: string;
  email_verified: boolean;
  picture?: string;
}

export class Auth0Service {
  private client: Auth0Client;
  
  constructor() {
    this.client = auth0;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      return await this.client.isAuthenticated();
    } catch (error) {
      console.error('Auth0 authentication check failed:', error);
      return false;
    }
  }

  async getUser(): Promise<Auth0User | null> {
    try {
      const user = await this.client.getUser();
      return user as Auth0User || null;
    } catch (error) {
      console.error('Auth0 get user failed:', error);
      return null;
    }
  }

  async loginWithRedirect(): Promise<void> {
    try {
      await this.client.loginWithRedirect();
    } catch (error) {
      console.error('Auth0 login failed:', error);
      throw error;
    }
  }

  async handleRedirectCallback(): Promise<void> {
    try {
      await this.client.handleRedirectCallback();
    } catch (error) {
      console.error('Auth0 callback handling failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
    } catch (error) {
      console.error('Auth0 logout failed:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await this.client.getTokenSilently();
    } catch (error) {
      console.error('Auth0 get access token failed:', error);
      return null;
    }
  }
}

export const auth0Service = new Auth0Service();