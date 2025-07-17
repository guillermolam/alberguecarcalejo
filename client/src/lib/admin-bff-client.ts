// Admin BFF Client for secure admin operations
import init, { AdminBFF } from './wasm/admin_bff';

let adminBffInstance: AdminBFF | null = null;

// Initialize the Admin BFF WASM module
export async function initAdminBFF(): Promise<AdminBFF> {
  if (!adminBffInstance) {
    await init();
    adminBffInstance = new AdminBFF();
  }
  return adminBffInstance;
}

// Generate admin client fingerprint (more detailed than regular users)
function getAdminClientFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '12px Arial';
    ctx.fillText('Admin fingerprint', 2, 2);
    ctx.font = '11px Arial';
    ctx.fillText(navigator.userAgent.slice(0, 50), 2, 15);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(',') || '',
    screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.deviceMemory || 'unknown',
    canvas.toDataURL()
  ].join('|');
  
  // Enhanced hash function for admin
  let hash = 5381;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = ((hash << 5) + hash) + fingerprint.charCodeAt(i);
  }
  
  return Math.abs(hash).toString(16);
}

// Hash password on client side (still needs server verification)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Admin authentication check
export async function checkAdminAuth(
  username: string, 
  password: string
): Promise<{
  allowed: boolean;
  errorMessage?: string;
  lockoutTime?: number;
}> {
  try {
    const bff = await initAdminBFF();
    const clientId = getAdminClientFingerprint();
    const passwordHash = await hashPassword(password);
    
    const result = bff.check_auth_attempt(clientId, username, passwordHash);
    
    return {
      allowed: result.allowed,
      errorMessage: result.error_message || undefined,
      lockoutTime: result.lockout_time || undefined
    };
  } catch (error) {
    console.error('Admin BFF auth error:', error);
    return {
      allowed: false,
      errorMessage: 'Authentication service temporarily unavailable'
    };
  }
}

// Admin operation permission check
export async function checkAdminOperation(operation: string): Promise<{
  allowed: boolean;
  errorMessage?: string;
}> {
  try {
    const bff = await initAdminBFF();
    const clientId = getAdminClientFingerprint();
    const result = bff.check_admin_operation(clientId, operation);
    
    return {
      allowed: result.allowed,
      errorMessage: result.error_message || undefined
    };
  } catch (error) {
    console.error('Admin BFF operation check error:', error);
    return {
      allowed: false,
      errorMessage: 'Authorization service temporarily unavailable'
    };
  }
}

// Admin export permission check
export async function checkAdminExport(exportType: string): Promise<{
  allowed: boolean;
  errorMessage?: string;
}> {
  try {
    const bff = await initAdminBFF();
    const clientId = getAdminClientFingerprint();
    const result = bff.check_export_request(clientId, exportType);
    
    return {
      allowed: result.allowed,
      errorMessage: result.error_message || undefined
    };
  } catch (error) {
    console.error('Admin BFF export check error:', error);
    return {
      allowed: false,
      errorMessage: 'Export service temporarily unavailable'
    };
  }
}

// Reset authentication failures (after successful login)
export async function resetAdminAuthFailures(): Promise<void> {
  try {
    const bff = await initAdminBFF();
    const clientId = getAdminClientFingerprint();
    bff.reset_auth_failures(clientId);
  } catch (error) {
    console.error('Admin BFF reset error:', error);
  }
}

// Security monitoring - detect suspicious patterns
export function detectSuspiciousActivity(): {
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
} {
  const factors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Check for automated behavior
  if (window.navigator.webdriver) {
    factors.push('Automated browser detected');
    riskLevel = 'high';
  }

  // Check for unusual browser features
  if (!window.navigator.userAgent.includes('Chrome') && 
      !window.navigator.userAgent.includes('Firefox') && 
      !window.navigator.userAgent.includes('Safari')) {
    factors.push('Unusual browser');
    riskLevel = 'medium';
  }

  // Check for developer tools
  let devtools = false;
  const threshold = 160;
  if (window.outerHeight - window.innerHeight > threshold || 
      window.outerWidth - window.innerWidth > threshold) {
    devtools = true;
    factors.push('Developer tools detected');
    riskLevel = 'medium';
  }

  // Check for suspicious timing patterns
  const now = Date.now();
  const lastActivity = parseInt(localStorage.getItem('lastAdminActivity') || '0');
  if (lastActivity && (now - lastActivity) < 1000) {
    factors.push('Rapid successive requests');
    riskLevel = 'medium';
  }
  localStorage.setItem('lastAdminActivity', now.toString());

  return { riskLevel, factors };
}