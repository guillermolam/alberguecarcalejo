// Gateway proxy for Spin framework using JavaScript SDK
// Routes requests to appropriate Rust microservices

const { Router } = require('@fermyon/spin-sdk');

const router = Router();

// Auth0 configuration from Spin variables
function getAuth0Config() {
  return {
    domain: process.env.SPIN_VARIABLE_AUTH0_DOMAIN || 'guillermolam.auth0.com',
    clientId: process.env.SPIN_VARIABLE_AUTH0_CLIENT_ID || 'ohunbmaWBOQyEd2ca1orhnFqN1DDPQBd',
    clientSecret: process.env.SPIN_VARIABLE_AUTH0_CLIENT_SECRET || ''
  };
}

// Security routes
router.get('/api/security/*', async (req) => {
  const response = await fetch('http://localhost:3001' + req.url.pathname, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
  return response;
});

// Rate limiting routes  
router.all('/api/rate-limit/*', async (req) => {
  const response = await fetch('http://localhost:3002' + req.url.pathname, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
  return response;
});

// Auth verification routes
router.all('/api/auth/*', async (req) => {
  const response = await fetch('http://localhost:3003' + req.url.pathname, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
  return response;
});

// Booking service routes
router.all('/api/booking/*', async (req) => {
  const response = await fetch('http://localhost:3004' + req.url.pathname, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
  return response;
});

// Reviews service routes
router.all('/api/reviews/*', async (req) => {
  const response = await fetch('http://localhost:3005' + req.url.pathname, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
  return response;
});

// Health check
router.get('/health', async () => {
  const config = getAuth0Config();
  return new Response(JSON.stringify({
    status: 'Gateway running',
    timestamp: new Date().toISOString(),
    auth0_configured: {
      domain: !!config.domain,
      client_id: !!config.clientId,
      client_secret: !!config.clientSecret
    },
    services: {
      security: 'http://localhost:3001',
      rate_limiter: 'http://localhost:3002', 
      auth_verify: 'http://localhost:3003',
      booking: 'http://localhost:3004',
      reviews: 'http://localhost:3005'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Handle all requests
module.exports = async function handleRequest(request) {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const response = await router.handle(request);
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Gateway Error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};