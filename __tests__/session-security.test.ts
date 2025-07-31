import { describe, expect, test, beforeEach, vi } from 'vitest';
import { validateSession, createSessionMetadata, revokeSession } from '../src/lib/session';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

// Mock next-auth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('Session Security', () => {
  let mockRequest: any;
  let mockSession: any;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      headers: new Map([
        ['user-agent', 'test-browser']
      ]),
    };

    mockSession = {
      user: { id: 'test-user' },
      metadata: {
        ip: '127.0.0.1',
        userAgent: 'test-browser',
        lastActive: new Date(),
      },
    };

    // Reset mocks
    vi.mocked(getServerSession).mockReset();
  });

  test('should validate valid session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const response = await validateSession(mockRequest);
    expect(response.status).toBe(200);
  });

  test('should reject session with mismatched IP', async () => {
    mockSession.metadata.ip = '192.168.1.1';
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const response = await validateSession(mockRequest);
    expect(response.status).toBe(403);
  });

  test('should reject session with mismatched user agent', async () => {
    mockSession.metadata.userAgent = 'different-browser';
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const response = await validateSession(mockRequest);
    expect(response.status).toBe(403);
  });

  test('should reject expired session', async () => {
    mockSession.metadata.lastActive = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const response = await validateSession(mockRequest);
    expect(response.status).toBe(401);
  });

  test('should create session metadata', async () => {
    const metadata = await createSessionMetadata(mockRequest);

    expect(metadata.ip).toBe('127.0.0.1');
    expect(metadata.userAgent).toBe('test-browser');
    expect(metadata.lastActive).toBeInstanceOf(Date);
  });

  test('should revoke session', async () => {
    const sessionToken = 'test-session-token';
    await expect(revokeSession(sessionToken)).resolves.not.toThrow();
  });

  test('should update lastActive on valid session', async () => {
    const oldLastActive = mockSession.metadata.lastActive;
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    await validateSession(mockRequest);
    
    expect(mockSession.metadata.lastActive).not.toBe(oldLastActive);
    expect(mockSession.metadata.lastActive).toBeInstanceOf(Date);
  });

  test('should reject session without metadata', async () => {
    delete mockSession.metadata;
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const response = await validateSession(mockRequest);
    expect(response.status).toBe(401); // Changed from 403 to 401
  });
});
