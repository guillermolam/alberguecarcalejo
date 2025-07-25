// Auth0 integration for Spin Gateway
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Auth0 configuration from environment variables
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

// Application URLs for Auth0 configuration
export const AUTH0_CONFIG = {
  // Application URIs for Auth0 Dashboard
  LOGIN_URL: 'https://alberguecarrascalejo.fermyon.app/login',
  CALLBACK_URLS: [
    'https://alberguecarrascalejo.fermyon.app/callback',
    'http://localhost:5173/callback',
    'http://localhost:8000/callback'
  ].join(','),
  LOGOUT_URLS: [
    'https://alberguecarrascalejo.fermyon.app',
    'https://alberguecarrascalejo.fermyon.app/logout',
    'http://localhost:5173',
    'http://localhost:8000'
  ].join(','),
  ALLOWED_ORIGINS: [
    'https://alberguecarrascalejo.fermyon.app',
    'http://localhost:5173',
    'http://localhost:8000'
  ].join(',')
};

// Create JWKS endpoint for token verification
const JWKS = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));

// JWT verification middleware using proper cryptographic verification
export async function verifyAuth0Token(token) {
  try {
    if (!token || !token.startsWith('eyJ')) {
      throw new Error('Invalid token format');
    }
    
    // Verify the JWT using Auth0's JWKS
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${AUTH0_DOMAIN}/`,
      audience: AUTH0_CLIENT_ID,
    });
    
    return payload;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

// Auth0 authentication middleware
export function requireAuth0(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      auth_url: `https://${AUTH0_DOMAIN}/authorize?response_type=code&client_id=${AUTH0_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://alberguecarrascalejo.fermyon.app/callback')}&scope=openid profile email`
    });
  }
  
  verifyAuth0Token(token)
    .then(payload => {
      req.user = payload;
      next();
    })
    .catch(error => {
      res.status(401).json({
        error: 'Invalid token',
        message: error.message,
        auth_url: `https://${AUTH0_DOMAIN}/authorize?response_type=code&client_id=${AUTH0_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://alberguecarrascalejo.fermyon.app/callback')}&scope=openid profile email`
      });
    });
}

// Auth0 login route
export function handleLogin(req, res) {
  const redirectUri = req.query.redirect_uri || 'https://alberguecarrascalejo.fermyon.app/callback';
  const authUrl = `https://${AUTH0_DOMAIN}/authorize?` +
    `response_type=code&` +
    `client_id=${AUTH0_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=openid profile email&` +
    `state=${req.query.state || 'default'}`;
  
  res.redirect(authUrl);
}

// Auth0 callback route
export async function handleCallback(req, res) {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.status(400).json({ error: 'Authentication failed', details: error });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }
  
  try {
    // Exchange code for token
    const tokenResponse = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_CLIENT_SECRET,
        code: code,
        redirect_uri: 'https://alberguecarrascalejo.fermyon.app/callback'
      })
    });
    
    const tokens = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || 'Token exchange failed');
    }
    
    // Return tokens to frontend (in production, set as secure cookies)
    res.json({
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Token exchange failed', 
      message: error.message 
    });
  }
}

// Auth0 logout route
export function handleLogout(req, res) {
  const returnTo = req.query.returnTo || 'https://alberguecarrascalejo.fermyon.app';
  const logoutUrl = `https://${AUTH0_DOMAIN}/v2/logout?` +
    `client_id=${AUTH0_CLIENT_ID}&` +
    `returnTo=${encodeURIComponent(returnTo)}`;
  
  res.redirect(logoutUrl);
}

console.log('🔐 Auth0 Configuration for Application Setup:');
console.log('📝 Copy these URLs to your Auth0 Dashboard:');
console.log('');
console.log('🔗 Application Login URL:');
console.log('   ', AUTH0_CONFIG.LOGIN_URL);
console.log('');
console.log('↩️  Allowed Callback URLs:');
console.log('   ', AUTH0_CONFIG.CALLBACK_URLS);
console.log('');
console.log('🚪 Allowed Logout URLs:');
console.log('   ', AUTH0_CONFIG.LOGOUT_URLS);
console.log('');
console.log('🌐 Allowed Web Origins:');
console.log('   ', AUTH0_CONFIG.ALLOWED_ORIGINS);
console.log('');