// Simple proxy to Rust WASM backend deployed on Cloudflare Workers
const BACKEND_URL = process.env.RUST_BACKEND_URL || 'http://localhost:8787'; // Cloudflare Workers local dev port

export async function proxyToRustBackend(endpoint: string, method: string = 'POST', body?: any) {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Proxy error for ${endpoint}:`, error);
    throw error;
  }
}

// Specific proxy functions for each endpoint
export async function validateDocument(documentType: string, documentNumber: string) {
  // Set a shorter timeout to fail fast if backend is unavailable
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/validate/document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_type: documentType,
        document_number: documentNumber,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error; // Re-throw to be caught by fallback logic
  }
}

export async function validateEmail(email: string) {
  return proxyToRustBackend('/api/validate/email', 'POST', { email });
}

export async function validatePhone(phone: string, countryCode: string) {
  return proxyToRustBackend('/api/validate/phone', 'POST', {
    phone,
    country_code: countryCode,
  });
}

export async function getCountryInfo(countryName: string) {
  return proxyToRustBackend('/api/country/info', 'POST', {
    country_name: countryName,
  });
}

export async function checkAvailability(checkInDate: string, checkOutDate: string, numberOfPersons: number) {
  // Set a shorter timeout to fail fast if backend is unavailable
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/db/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        number_of_persons: numberOfPersons,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error; // Re-throw to be caught by fallback logic
  }
}

export async function getDashboardStats() {
  return proxyToRustBackend('/api/db/stats', 'GET');
}

export async function authenticateAdmin(username: string, password: string) {
  return proxyToRustBackend('/api/admin/auth', 'POST', {
    username,
    password,
  });
}

export async function registerPilgrim(pilgrimData: any, bookingData: any, paymentData: any) {
  return proxyToRustBackend('/api/db/register', 'POST', {
    pilgrim: pilgrimData,
    booking: bookingData,
    payment: paymentData,
  });
}