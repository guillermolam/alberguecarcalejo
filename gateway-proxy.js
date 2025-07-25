#!/usr/bin/env node
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
// Temporarily comment out Auth0 imports while debugging the module loading issue
// import { 
//   requireAuth0, 
//   handleLogin, 
//   handleCallback, 
//   handleLogout,
//   AUTH0_CONFIG 
// } from './gateway/auth0.js';

// Auth0 handlers using Spin Framework variables pattern
const getSpinVariable = (name) => {
  // Spin Framework variables system - using SPIN_VARIABLE_ prefix as documented
  return process.env[`SPIN_VARIABLE_${name.toUpperCase()}`] || process.env[name.toUpperCase()];
};

const getAuth0Config = () => ({
  domain: getSpinVariable('auth0_domain'),
  clientId: getSpinVariable('auth0_client_id'),
  clientSecret: getSpinVariable('auth0_client_secret'),
  bookingApiUrl: getSpinVariable('booking_api_url') || 'http://localhost:3001',
  reviewsApiUrl: getSpinVariable('reviews_api_url') || 'http://localhost:3002'
});

const handleLogin = (req, res) => {
  const config = getAuth0Config();
  const redirectUri = req.query.redirect_uri || 'https://alberguecarrascalejo.fermyon.app/callback';
  const authUrl = `https://${config.domain}/authorize?` +
    `response_type=code&` +
    `client_id=${config.clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=openid profile email&` +
    `state=${req.query.state || 'default'}`;
  
  console.log('🔐 Spin Variables Auth0 Login redirect to:', authUrl);
  res.redirect(authUrl);
};

const handleCallback = async (req, res) => {
  const config = getAuth0Config();
  const { code, state, error } = req.query;
  console.log('🔐 Spin Variables Auth0 Callback received:', { code: !!code, error });
  
  if (error) {
    return res.status(400).json({ error: 'Authentication failed', details: error });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }
  
  try {
    // Exchange code for token using Spin variables
    const tokenResponse = await fetch(`https://${config.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        redirect_uri: 'https://alberguecarrascalejo.fermyon.app/callback'
      })
    });
    
    const tokens = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || 'Token exchange failed');
    }
    
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
};

const handleLogout = (req, res) => {
  const config = getAuth0Config();
  const returnTo = req.query.returnTo || 'https://alberguecarrascalejo.fermyon.app';
  const logoutUrl = `https://${config.domain}/v2/logout?` +
    `client_id=${config.clientId}&` +
    `returnTo=${encodeURIComponent(returnTo)}`;
  
  console.log('🔐 Spin Variables Auth0 Logout redirect to:', logoutUrl);
  res.redirect(logoutUrl);
};

const requireAuth0 = async (req, res, next) => {
  const config = getAuth0Config();
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      auth_url: `https://${config.domain}/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent('https://alberguecarrascalejo.fermyon.app/callback')}&scope=openid profile email`,
      spin_variables_configured: {
        auth0_domain: !!config.domain,
        auth0_client_id: !!config.clientId,
        auth0_client_secret: !!config.clientSecret
      }
    });
  }
  
  try {
    // Basic JWT validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    // Check audience and issuer
    if (payload.aud !== config.clientId) {
      throw new Error('Invalid audience');
    }
    
    if (payload.iss !== `https://${config.domain}/`) {
      throw new Error('Invalid issuer');
    }
    
    req.auth0User = payload;
    next();
    
  } catch (error) {
    res.status(401).json({
      error: 'Invalid token',
      message: error.message,
      auth_url: `https://${config.domain}/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent('https://alberguecarrascalejo.fermyon.app/callback')}&scope=openid profile email`
    });
  }
};

const app = express();
const PORT = 8000;



// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Auth0 authentication routes
app.get('/login', handleLogin);
app.get('/callback', handleCallback);
app.get('/logout', handleLogout);

// Protected admin routes requiring Auth0 authentication 
app.use('/booking/dashboard', requireAuth0);
app.use('/booking/admin', requireAuth0);

// Fallback to basic auth for development (remove in production)
const basicAuthFallback = (req, res, next) => {
  // If Auth0 fails, fall back to basic auth for development
  const auth = req.headers.authorization;
  
  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const credentials = Buffer.from(auth.substring(6), 'base64').toString();
  const [username, password] = credentials.split(':');
  
  if (username === 'admin' && password === 'admin') {
    next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Proxy all booking requests to the API server
app.use('/booking', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/booking': '/booking'
  },
  onError: (err, req, res) => {
    console.error('Gateway proxy error:', err.message);
    res.status(500).json({ error: 'Gateway service unavailable' });
  }
}));

// Proxy reviews requests to the reviews service (no auth required - public data)
app.use('/reviews', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/reviews': '/reviews'
  },
  onError: (err, req, res) => {
    console.error('Reviews service error:', err.message);
    res.status(500).json({ error: 'Reviews service unavailable' });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway running', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️  Gateway with route protection running on port ${PORT}`);
  console.log(`🔒 Protected routes: /booking/dashboard/*, /booking/admin/* (Auth0)`);
  console.log(`📝 Public routes: /reviews/* (via reviews service)`);
  console.log(`🔐 Auth0 endpoints: /login, /callback, /logout`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  
  // Display Auth0 configuration
  console.log('');
  console.log('🔗 Auth0 Application Configuration URLs:');
  console.log('📝 Application Login URL:');
  console.log('   https://alberguecarrascalejo.fermyon.app/login');
  console.log('↩️  Allowed Callback URLs:');
  console.log('   https://alberguecarrascalejo.fermyon.app/callback,http://localhost:5173/callback,http://localhost:8000/callback');
  console.log('🚪 Allowed Logout URLs:');
  console.log('   https://alberguecarrascalejo.fermyon.app,https://alberguecarrascalejo.fermyon.app/logout,http://localhost:5173,http://localhost:8000');
  console.log('🌐 Allowed Web Origins:');
  console.log('   https://alberguecarrascalejo.fermyon.app,http://localhost:5173,http://localhost:8000');
});