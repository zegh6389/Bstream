import { describe, expect, test } from 'vitest';
import { generateNonce, setSecurityHeaders } from '../src/lib/security-headers';
import { NextResponse } from 'next/server';

describe('Security Headers', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      headers: new Map(),
      nextUrl: new URL('http://localhost:3000'),
    };
    mockResponse = new NextResponse();
  });

  test('should generate valid nonce', () => {
    const nonce = generateNonce();
    expect(nonce).toBeDefined();
    expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 format
  });

  test('should set all required security headers', () => {
    setSecurityHeaders(mockRequest, mockResponse);
    
    // Content Security Policy
    const csp = mockResponse.headers.get('Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain('nonce-');
    expect(csp).toContain("style-src 'self'");
    
    // Other security headers
    expect(mockResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(mockResponse.headers.get('X-Frame-Options')).toBe('DENY');
    expect(mockResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(mockResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  test('should include nonce in response headers', () => {
    setSecurityHeaders(mockRequest, mockResponse);
    
    const nonce = mockResponse.headers.get('X-Nonce');
    expect(nonce).toBeDefined();
    expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
    
    const csp = mockResponse.headers.get('Content-Security-Policy');
    expect(csp).toContain(`'nonce-${nonce}'`);
  });

  test('should set strict Content-Security-Policy', () => {
    setSecurityHeaders(mockRequest, mockResponse);
    
    const csp = mockResponse.headers.get('Content-Security-Policy');
    
    // Check for strict CSP directives
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self' 'strict-dynamic'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  test('should set secure cache control headers', () => {
    setSecurityHeaders(mockRequest, mockResponse);
    
    const cacheControl = mockResponse.headers.get('Cache-Control');
    expect(cacheControl).toBe('no-store, max-age=0');
  });

  test('should set restrictive permissions policy', () => {
    setSecurityHeaders(mockRequest, mockResponse);
    
    const permissions = mockResponse.headers.get('Permissions-Policy');
    expect(permissions).toBeDefined();
    expect(permissions).toContain('camera=()');
    expect(permissions).toContain('microphone=()');
    expect(permissions).toContain('payment=()');
  });
});
