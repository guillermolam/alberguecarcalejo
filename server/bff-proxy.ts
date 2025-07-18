// BFF Proxy Layer - Routes requests to secure Rust BFF modules
import { Request, Response } from 'express';

interface BFFRequest {
  clientId: string;
  authToken?: string;
  data?: any;
}

interface BFFResponse {
  success: boolean;
  data?: any;
  error?: string;
  rate_limited?: boolean;
  retry_after?: number;
  requires_auth?: boolean;
}

// Load the compiled WASM modules
let adminBFF: any = null;
let registrationBFF: any = null;
let countryBFF: any = null;

// Initialize BFF modules
export async function initBFFModules() {
  try {
    console.log('Initializing BFF modules...');
    
    // For now, use mock implementations until WASM modules are built
    adminBFF = {
      authenticate_admin: async (credentials: string, clientId: string) => {
        return JSON.stringify({
          success: true,
          data: { token: 'mock_token_' + Date.now() },
          message: 'Authentication successful (mock)',
          rate_limited: false
        });
      },
      get_dashboard_stats: async (token: string, clientId: string) => {
        return JSON.stringify({
          success: true,
          data: {
            occupancy: { occupied: 0, available: 25, total: 25 },
            bookings: { active: 0, checked_in: 0 },
            revenue: { today: 0, week: 0, month: 0 }
          },
          rate_limited: false
        });
      },
      get_beds: async (token: string, clientId: string) => {
        return JSON.stringify({
          success: true,
          data: [],
          rate_limited: false
        });
      },
      update_bed_status: async (data: string, token: string, clientId: string) => {
        return JSON.stringify({
          success: true,
          data: { updated: true },
          rate_limited: false
        });
      },
      retry_government_submission: async (data: string, token: string, clientId: string) => {
        return JSON.stringify({
          success: true,
          data: { submitted: true },
          rate_limited: false
        });
      },
      logout_admin: async (token: string) => {
        return JSON.stringify({
          success: true,
          data: { message: 'Logged out' }
        });
      },
      get_admin_rate_limit_status: async (clientId: string) => {
        return JSON.stringify({
          client_id: clientId,
          limits: {}
        });
      }
    };
    
    registrationBFF = {
      register_pilgrim: async (data: string, clientId: string) => {
        return JSON.stringify({
          success: true,
          data: { registration_id: 'mock_' + Date.now() },
          rate_limited: false
        });
      },
      validate_document: async (data: string, clientId: string) => {
        return JSON.stringify({
          success: true,
          data: { valid: true },
          rate_limited: false
        });
      }
    };
    
    countryBFF = {
      get_country_info: async (countryName: string, clientId: string) => {
        return JSON.stringify({
          success: true,
          data: {
            calling_code: '+34',
            flag_url: 'https://flagcdn.com/w320/es.png',
            country_code: 'ES',
            country_name: countryName
          },
          rate_limited: false
        });
      }
    };
    
    console.log('BFF modules initialized successfully (mock mode)');
  } catch (error) {
    console.error('Failed to initialize BFF modules:', error);
    throw error;
  }
}

// Generate client fingerprint for rate limiting
function generateClientId(req: Request): string {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const forwarded = req.get('X-Forwarded-For') || '';
  
  // Create a simple fingerprint (in production, use more sophisticated methods)
  return `${ip}_${Buffer.from(userAgent).toString('base64').slice(0, 16)}_${forwarded}`.replace(/[^a-zA-Z0-9_]/g, '');
}

// Admin authentication endpoint
export async function adminAuth(req: Request, res: Response) {
  if (!adminBFF) {
    return res.status(503).json({ error: 'Admin BFF not initialized' });
  }

  try {
    const clientId = generateClientId(req);
    const credentials = JSON.stringify(req.body);
    
    const result = await adminBFF.authenticate_admin(credentials, clientId);
    const response: BFFResponse = JSON.parse(result);
    
    if (response.rate_limited) {
      return res.status(429).json(response);
    }
    
    if (response.success) {
      res.status(200).json(response);
    } else {
      res.status(401).json(response);
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Admin dashboard stats
export async function getDashboardStats(req: Request, res: Response) {
  if (!adminBFF) {
    return res.status(503).json({ error: 'Admin BFF not initialized' });
  }

  try {
    const clientId = generateClientId(req);
    const authToken = req.headers.authorization?.replace('Bearer ', '') || '';
    
    const result = await adminBFF.get_dashboard_stats(authToken, clientId);
    const response: BFFResponse = JSON.parse(result);
    
    if (response.requires_auth) {
      return res.status(401).json(response);
    }
    
    if (response.rate_limited) {
      return res.status(429).json(response);
    }
    
    res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
}

// Admin beds management
export async function getBeds(req: Request, res: Response) {
  if (!adminBFF) {
    return res.status(503).json({ error: 'Admin BFF not initialized' });
  }

  try {
    const clientId = generateClientId(req);
    const authToken = req.headers.authorization?.replace('Bearer ', '') || '';
    
    const result = await adminBFF.get_beds(authToken, clientId);
    const response: BFFResponse = JSON.parse(result);
    
    if (response.requires_auth) {
      return res.status(401).json(response);
    }
    
    if (response.rate_limited) {
      return res.status(429).json(response);
    }
    
    res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    console.error('Get beds error:', error);
    res.status(500).json({ error: 'Failed to get beds' });
  }
}

// Update bed status
export async function updateBedStatus(req: Request, res: Response) {
  if (!adminBFF) {
    return res.status(503).json({ error: 'Admin BFF not initialized' });
  }

  try {
    const clientId = generateClientId(req);
    const authToken = req.headers.authorization?.replace('Bearer ', '') || '';
    const requestData = JSON.stringify(req.body);
    
    const result = await adminBFF.update_bed_status(requestData, authToken, clientId);
    const response: BFFResponse = JSON.parse(result);
    
    if (response.requires_auth) {
      return res.status(401).json(response);
    }
    
    if (response.rate_limited) {
      return res.status(429).json(response);
    }
    
    res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    console.error('Update bed status error:', error);
    res.status(500).json({ error: 'Failed to update bed status' });
  }
}

// Registration endpoint through Registration BFF
export async function registerPilgrim(req: Request, res: Response) {
  if (!registrationBFF) {
    return res.status(503).json({ error: 'Registration BFF not initialized' });
  }

  try {
    const clientId = generateClientId(req);
    const registrationData = JSON.stringify(req.body);
    
    const result = await registrationBFF.register_pilgrim(registrationData, clientId);
    const response: BFFResponse = JSON.parse(result);
    
    if (response.rate_limited) {
      return res.status(429).json(response);
    }
    
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// Document validation through Registration BFF
export async function validateDocument(req: Request, res: Response) {
  if (!registrationBFF) {
    return res.status(503).json({ error: 'Registration BFF not initialized' });
  }

  try {
    const clientId = generateClientId(req);
    const validationData = JSON.stringify(req.body);
    
    const result = await registrationBFF.validate_document(validationData, clientId);
    const response: BFFResponse = JSON.parse(result);
    
    if (response.rate_limited) {
      return res.status(429).json(response);
    }
    
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error('Document validation error:', error);
    res.status(500).json({ error: 'Document validation failed' });
  }
}

// Country information through Country BFF
export async function getCountryInfo(req: Request, res: Response) {
  if (!countryBFF) {
    return res.status(503).json({ error: 'Country BFF not initialized' });
  }

  try {
    const clientId = generateClientId(req);
    const { countryName } = req.body;
    
    const result = await countryBFF.get_country_info(countryName, clientId);
    const response: BFFResponse = JSON.parse(result);
    
    if (response.rate_limited) {
      return res.status(429).json(response);
    }
    
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error('Country info error:', error);
    res.status(500).json({ error: 'Failed to get country information' });
  }
}

// Government submission retry
export async function retryGovernmentSubmission(req: Request, res: Response) {
  if (!adminBFF) {
    return res.status(503).json({ error: 'Admin BFF not initialized' });
  }

  try {
    const clientId = generateClientId(req);
    const authToken = req.headers.authorization?.replace('Bearer ', '') || '';
    const requestData = JSON.stringify(req.body);
    
    const result = await adminBFF.retry_government_submission(requestData, authToken, clientId);
    const response: BFFResponse = JSON.parse(result);
    
    if (response.requires_auth) {
      return res.status(401).json(response);
    }
    
    if (response.rate_limited) {
      return res.status(429).json(response);
    }
    
    res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    console.error('Government submission retry error:', error);
    res.status(500).json({ error: 'Failed to retry government submission' });
  }
}

// Admin logout
export async function adminLogout(req: Request, res: Response) {
  if (!adminBFF) {
    return res.status(503).json({ error: 'Admin BFF not initialized' });
  }

  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '') || '';
    
    const result = await adminBFF.logout_admin(authToken);
    const response: BFFResponse = JSON.parse(result);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

// Rate limit status check
export async function getRateLimitStatus(req: Request, res: Response) {
  const clientId = generateClientId(req);
  
  try {
    if (adminBFF) {
      const adminStatus = await adminBFF.get_admin_rate_limit_status(clientId);
      res.status(200).json({
        admin: JSON.parse(adminStatus),
        client_id: clientId
      });
    } else {
      res.status(503).json({ error: 'BFF modules not initialized' });
    }
  } catch (error) {
    console.error('Rate limit status error:', error);
    res.status(500).json({ error: 'Failed to get rate limit status' });
  }
}