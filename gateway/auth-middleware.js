// Gateway-level authentication middleware for Spin
export function validateBasicAuth(request) {
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