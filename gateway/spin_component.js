// Spin gateway component with route protection
function validateBasicAuth(request) {
  const auth = request.headers.get('authorization');
  
  if (!auth || !auth.startsWith('Basic ')) {
    return {
      authenticated: false,
      response: new Response('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
          'Content-Type': 'text/plain'
        }
      })
    };
  }
  
  try {
    const credentials = atob(auth.substring(6));
    const [username, password] = credentials.split(':');
    
    if (username === 'admin' && password === 'admin') {
      return { authenticated: true };
    }
  } catch (error) {
    // Invalid base64 encoding
  }
  
  return {
    authenticated: false,
    response: new Response('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
        'Content-Type': 'text/plain'
      }
    })
  };
}

export async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Define protected admin routes at gateway level
  const protectedRoutes = [
    '/booking/dashboard',
    '/booking/admin'
  ];
  
  // Check if route requires authentication
  const isProtected = protectedRoutes.some(route => 
    url.pathname.startsWith(route)
  );
  
  if (isProtected) {
    const authResult = validateBasicAuth(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
  }
  
  // Route booking requests to the booking service
  if (url.pathname.startsWith('/booking')) {
    const backendUrl = `http://localhost:3001${url.pathname}${url.search}`;
    
    // Forward the request (remove auth processing from backend)
    return await fetch(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });
  }
  
  // Serve static frontend files
  if (url.pathname === '/' || url.pathname.startsWith('/assets/')) {
    return new Response('Frontend served here', { 
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}