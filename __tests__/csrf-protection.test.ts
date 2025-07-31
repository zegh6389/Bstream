import { describe, expect, test, beforeEach, vi } from 'vitest';
import { generateCsrfToken, validateCsrfToken, setCsrfToken } from '../src/lib/csrf';
import { NextResponse } from 'next/server';

describe('CSRF Protection', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    // Mock request
    mockRequest = {
      headers: {
        get: (key: string) => key === 'X-CSRF-Token' ? mockRequest._token : null,
        set: (key: string, value: string) => { mockRequest._token = value; }
      },
      cookies: {
        get: (key: string) => key === '__Host-csrf' ? { value: mockRequest._cookie } : null,
        set: (key: string, value: string) => { mockRequest._cookie = value; }
      },
      _token: null,
      _cookie: null,
      method: 'POST',
    };

    // Mock response
    mockResponse = new NextResponse();
  });

  test('should generate CSRF token', async () => {
    const token = await generateCsrfToken();
    expect(token).toBeDefined();
    expect(token).toHaveLength(64); // 32 bytes hex encoded
  });

  test('should set CSRF token in response', async () => {
    await setCsrfToken(mockResponse);
    
    const cookieHeader = mockResponse.headers.get('Set-Cookie');
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain('__Host-csrf=');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader.toLowerCase()).toContain('samesite=strict');
    expect(cookieHeader).toContain('Path=/');
  });

  test('should validate matching tokens', async () => {
    const token = await generateCsrfToken();
    
    mockRequest.headers.set('X-CSRF-Token', token);
    mockRequest.cookies.set('__Host-csrf', token);

    const isValid = validateCsrfToken(mockRequest);
    expect(isValid).toBe(true);
  });

  test('should reject mismatched tokens', async () => {
    const token1 = await generateCsrfToken();
    const token2 = await generateCsrfToken();
    
    mockRequest.headers.set('X-CSRF-Token', token1);
    mockRequest.cookies.set('__Host-csrf', token2);

    const isValid = validateCsrfToken(mockRequest);
    expect(isValid).toBe(false);
  });

  test('should reject missing header token', async () => {
    const token = await generateCsrfToken();
    mockRequest.cookies.set('__Host-csrf', token);

    const isValid = validateCsrfToken(mockRequest);
    expect(isValid).toBe(false);
  });

  test('should reject missing cookie token', async () => {
    const token = await generateCsrfToken();
    mockRequest.headers.set('X-CSRF-Token', token);

    const isValid = validateCsrfToken(mockRequest);
    expect(isValid).toBe(false);
  });
});
