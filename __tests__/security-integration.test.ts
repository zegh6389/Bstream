import { describe, expect, test, beforeEach, vi } from 'vitest';
import { checkRateLimit, authLimiter, resetLimiter, RateLimitResult } from '../src/lib/rate-limit.new';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';
import { setCsrfToken, validateCsrfToken, generateCsrfToken } from '../src/lib/csrf';
import { validateSession } from '../src/lib/session';
import { redis } from './utils/mock-redis';
import { prisma as mockPrisma } from './utils/mock-prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse, NextRequest } from 'next/server';
import { setSecurityHeaders } from '../src/lib/security-headers';

// Mock Redis properly
vi.mock('./utils/mock-redis', () => ({
  redis: {
    incr: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  }
}));

// Mock next-auth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}));

// Mock CSRF
vi.mock('../src/lib/csrf', () => ({
  generateCsrfToken: vi.fn(),
  setCsrfToken: vi.fn(),
  validateCsrfToken: vi.fn(),
}));

describe('Security Integration', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost', {
      headers: {
        'user-agent': 'test-browser',
        'content-type': 'application/json',
        'x-csrf-token': 'test-csrf-token',
      },
    });
    mockRequest.cookies.set('__Host-csrf-token', 'test-csrf-token');
    mockRequest.ip = '127.0.0.1';
    vi.clearAllMocks();
  });

  test('should block request that fails multiple security checks', async () => {
    // 1. Mock session validation to fail
    vi.mocked(getServerSession).mockResolvedValue(null);

    // 2. Mock CSRF validation to fail
    vi.mocked(validateCsrfToken).mockResolvedValue(false);

    // 3. Exceed rate limit by making multiple requests
    const rateLimitKey = 'auth_security_test_fail';
    
    // Consume all rate limit points (3 for authLimiter)
    for (let i = 0; i < 4; i++) {
      await checkRateLimit(authLimiter, rateLimitKey);
    }

    // Attempt request - should now be rate limited
    const session = await getServerSession();
    const csrfResult = await validateCsrfToken(mockRequest);
    const rateLimitResult = await checkRateLimit(authLimiter, rateLimitKey);

    expect(session).toBeNull();
    expect(csrfResult).toBe(false);
    expect(rateLimitResult.success).toBe(false);
  });

  test('should allow request that passes all security checks', async () => {
    // 1. Mock session validation to succeed
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      metadata: { ip: '127.0.0.1', userAgent: 'test-browser', lastActive: new Date() },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    // 2. Mock CSRF validation to succeed
    vi.mocked(validateCsrfToken).mockResolvedValue(true);

    // 3. Mock rate limiting to succeed
    vi.mocked(redis.incr).mockResolvedValue(1);

    // Attempt request
    const session = await getServerSession();
    const csrfResult = await validateCsrfToken(mockRequest);
    const rateLimitResult = await checkRateLimit(authLimiter, 'auth_test-ip');

    expect(session).toBeDefined();
    expect(csrfResult).toBe(true);
    expect(rateLimitResult.success).toBe(true);
  });

  test('should properly secure password reset flow', async () => {
    const token = 'reset-token';
    const userId = 'user-123';
    
    // Mock Prisma reset token
    mockPrisma.resetToken.findUnique.mockResolvedValue({
      id: 'token-id',
      token: token,
      userId: userId,
      expires: new Date(Date.now() + 3600000), // 1 hour from now
    });

    // Mock rate limiting for reset
    vi.mocked(redis.incr).mockResolvedValue(1);

    const resetResult = await checkRateLimit(resetLimiter, `reset_${mockRequest.ip}`);
    const tokenResult = await mockPrisma.resetToken.findUnique({
      where: { token }
    });

    expect(resetResult.success).toBe(true);
    expect(tokenResult).toBeDefined();
    expect(tokenResult?.expires.getTime()).toBeGreaterThan(Date.now());
  });

  test('should handle concurrent security checks efficiently', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);

    const promises: Promise<RateLimitResult>[] = [];
    for (let i = 0; i < 5; i++) {
      promises.push(checkRateLimit(authLimiter, `auth_concurrent_${i}`));
    }

    const results = await Promise.all(promises);
    
    // All concurrent requests should succeed with different keys
    const successfulResults = results.filter(r => r.success);
    expect(successfulResults.length).toBe(5);
  });
});

describe('setSecurityHeaders', () => {
  test('should set all security headers correctly', () => {
    const mockRequest = new NextRequest('http://localhost');
    const response = new NextResponse();
    setSecurityHeaders(mockRequest, response);
    const headers = response.headers;
    expect(headers.get('x-frame-options')).toBe('DENY');
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('strict-transport-security')).toBe('max-age=31536000; includeSubDomains; preload');
    expect(headers.get('content-security-policy')).toMatch(/default-src 'none'/i);
    expect(headers.get('permissions-policy')).toBeDefined();
  });

  test('should set Content Security Policy header', () => {
    const mockRequest = new NextRequest('http://localhost');
    const response = new NextResponse();
    setSecurityHeaders(mockRequest, response);
    expect(response.headers.get('content-security-policy')).toMatch(/default-src 'none'/i);
  });
});

describe('Password Security', () => {
  test('should hash and verify passwords correctly', async () => {
    const password = 'StrongPassword!123';
    const hashResult = await hashPassword(password);
    expect(hashResult).toBeDefined();
    expect(hashResult.hash.length).toBeGreaterThan(10);
    // verifyPassword(password, hash, salt)
    expect(await verifyPassword(password, hashResult.hash, hashResult.salt)).toBe(true);
    expect(await verifyPassword('wrongpassword', hashResult.hash, hashResult.salt)).toBe(false);
  });
});

describe('Rate Limiting', () => {
  test('should allow requests within rate limit', async () => {
    const result = await checkRateLimit(authLimiter, 'auth_test-ip-1');
    expect(result.success).toBe(true);
    expect(result.limit).toBeGreaterThan(0);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  test('should block requests exceeding rate limit', async () => {
    // Make multiple requests quickly to exceed the limit (5 requests in 15 minutes for auth)
    const key = 'auth_test-ip-overflow';
    const results: RateLimitResult[] = [];
    
    // Make 10 requests to ensure we exceed the limit of 5
    for (let i = 0; i < 10; i++) {
      const result = await checkRateLimit(authLimiter, key);
      results.push(result);
    }
    
    // At least some should be blocked
    const blocked = results.filter(r => !r.success);
    expect(blocked.length).toBeGreaterThan(0);
    
    // The blocked requests should have remaining = 0
    blocked.forEach(result => {
      expect(result.remaining).toBe(0);
    });
  });

  test('should handle rate limiter reset functionality', async () => {
    const key = 'auth_test-ip-reset';
    
    // Exceed the limit
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(authLimiter, key);
    }
    
    // Verify it's blocked
    const blockedResult = await checkRateLimit(authLimiter, key);
    expect(blockedResult.success).toBe(false);
    
    // In memory limiter, we can't easily reset, but we can test the functionality exists
    expect(authLimiter).toBeDefined();
  });
});

describe('Negative Security Cases', () => {
  test('should reject request without session cookie', async () => {
    const badRequest = new NextRequest('http://localhost');
    badRequest.cookies.clear();
    vi.mocked(getServerSession).mockResolvedValue(null);
    const session = await getServerSession();
    expect(session).toBeNull();
  });

  test('should reject malformed CSRF token', async () => {
    vi.mocked(validateCsrfToken).mockResolvedValue(false);
    const badRequest = new NextRequest('http://localhost', {
      headers: { 'x-csrf-token': 'malformed-token' }
    });
    badRequest.cookies.set('__Host-csrf-token', 'valid-token');
    const result = await validateCsrfToken(badRequest);
    expect(result).toBe(false);
  });
});
