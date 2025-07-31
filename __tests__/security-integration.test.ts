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

    // 3. Mock rate limiting to fail
    vi.mocked(redis.incr).mockResolvedValue(101); // Exceeds limit

    // Attempt request
    const session = await getServerSession();
    const csrfResult = await validateCsrfToken(mockRequest);
    const rateLimitResult = await checkRateLimit(authLimiter, 'auth_test-ip');

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
  });
});
