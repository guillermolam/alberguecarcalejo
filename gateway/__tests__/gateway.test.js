// TypeScript/Jest integration tests for the gateway
import { expect, test, describe } from '@jest/globals';

describe('Gateway Integration Tests', () => {
  const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:8000';

  test('health endpoint returns healthy status', async () => {
    const response = await fetch(`${gatewayUrl}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('albergue-gateway');
    expect(data.components).toBeDefined();
  });

  test('index route serves HTML', async () => {
    const response = await fetch(`${gatewayUrl}/`);
    const html = await response.text();
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('<!DOCTYPE html>');
  });

  test('API routes require authentication', async () => {
    const response = await fetch(`${gatewayUrl}/api/bookings`);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  test('admin routes require admin role', async () => {
    const response = await fetch(`${gatewayUrl}/admin/dashboard`);
    const data = await response.json();
    
    expect(response.status).toBe(403);
    expect(data.error).toBe('Admin access required');
  });

  test('unknown routes return 404', async () => {
    const response = await fetch(`${gatewayUrl}/nonexistent`);
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.error).toBe('Route not found');
  });
});