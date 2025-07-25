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

// Simple test Auth0 handlers for debugging
const handleLogin = (req, res) => {
  const redirectUri = req.query.redirect_uri || 'https://alberguecarrascalejo.fermyon.app/callback';
  const authUrl = `https://${process.env.AUTH0_DOMAIN}/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.AUTH0_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=openid profile email&` +
    `state=${req.query.state || 'default'}`;
  
  console.log('🔐 Auth0 Login redirect to:', authUrl);
  res.redirect(authUrl);
};

const handleCallback = async (req, res) => {
  const { code, state, error } = req.query;
  console.log('🔐 Auth0 Callback received:', { code: !!code, error });
  
  if (error) {
    return res.status(400).json({ error: 'Authentication failed', details: error });
  }
  
  res.json({ 
    message: 'Auth0 callback received successfully',
    code: !!code,
    next_step: 'Token exchange would happen here'
  });
};

const handleLogout = (req, res) => {
  const returnTo = req.query.returnTo || 'https://alberguecarrascalejo.fermyon.app';
  const logoutUrl = `https://${process.env.AUTH0_DOMAIN}/v2/logout?` +
    `client_id=${process.env.AUTH0_CLIENT_ID}&` +
    `returnTo=${encodeURIComponent(returnTo)}`;
  
  console.log('🔐 Auth0 Logout redirect to:', logoutUrl);
  res.redirect(logoutUrl);
};

const requireAuth0 = (req, res, next) => {
  // For now, return auth info instead of blocking
  res.status(401).json({
    message: 'Auth0 authentication required',
    login_url: `https://${process.env.AUTH0_DOMAIN}/authorize?response_type=code&client_id=${process.env.AUTH0_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://alberguecarrascalejo.fermyon.app/callback')}&scope=openid profile email`,
    environment_check: {
      auth0_domain: !!process.env.AUTH0_DOMAIN,
      auth0_client_id: !!process.env.AUTH0_CLIENT_ID,
      auth0_client_secret: !!process.env.AUTH0_CLIENT_SECRET
    }
  });
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