// Simple Spin JS gateway component
export async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Route booking requests to the booking service
  if (url.pathname.startsWith('/api/booking')) {
    const bookingUrl = `http://localhost:3001${url.pathname.replace('/api', '')}${url.search}`;
    return await fetch(bookingUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }
  
  // Default response
  return new Response('Gateway routing', { status: 200 });
}