interface RateLimit {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// In-memory rate limiting (in production, use Redis)
const rateLimits = new Map<string, RateLimit>();

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'DOCUMENT_VALIDATION': { maxRequests: 10, windowMs: 5 * 60 * 1000 }, // 10 per 5 minutes
  'REGISTRATION': { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  'OCR_PROCESSING': { maxRequests: 5, windowMs: 10 * 60 * 1000 }, // 5 per 10 minutes
  'EMAIL_VALIDATION': { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  'PHONE_VALIDATION': { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
};

export function checkRateLimit(clientId: string, operationType: string): { allowed: boolean; resetTime?: number } {
  const config = RATE_LIMIT_CONFIGS[operationType];
  if (!config) {
    return { allowed: true }; // Allow if no config found
  }
  
  const now = Date.now();
  const key = `${clientId}:${operationType}`;
  const existing = rateLimits.get(key);
  
  if (!existing || now > existing.resetTime) {
    // Create new or reset expired limit
    rateLimits.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return { allowed: true };
  }
  
  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      resetTime: existing.resetTime
    };
  }
  
  // Increment count
  existing.count++;
  rateLimits.set(key, existing);
  
  return { allowed: true };
}

export function getClientFingerprint(req: any): string {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const forwarded = req.get('X-Forwarded-For') || '';
  
  // Create a simple fingerprint (in production, use more sophisticated methods)
  return `${ip}_${Buffer.from(userAgent).toString('base64').slice(0, 16)}_${forwarded}`.replace(/[^a-zA-Z0-9_]/g, '');
}

// Clean up expired rate limits periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of rateLimits.entries()) {
    if (now > limit.resetTime) {
      rateLimits.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute