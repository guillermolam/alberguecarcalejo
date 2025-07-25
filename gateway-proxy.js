#!/usr/bin/env node
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 8000;

// Basic Authentication middleware for gateway-level protection
const basicAuth = (req, res, next) => {
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

// Protected admin routes requiring authentication at gateway level
app.use('/booking/dashboard', basicAuth);
app.use('/booking/admin', basicAuth);

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
  console.log(`🔒 Protected routes: /booking/dashboard/*, /booking/admin/*`);
  console.log(`📝 Public routes: /reviews/* (via reviews service)`);
  console.log(`🔑 Admin credentials: admin/admin`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});