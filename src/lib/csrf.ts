import { type NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { randomBytes, timingSafeEqual } from 'crypto';

const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const CSRF_TOKEN_COOKIE = '__Host-csrf';
const CSRF_SECRET = process.env.CSRF_SECRET || randomBytes(32).toString('hex');

export async function generateCsrfToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

export async function setCsrfToken(response: NextResponse): Promise<void> {
  const token = await generateCsrfToken();
  
  // Set CSRF token in a secure cookie
  response.cookies.set({
    name: CSRF_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
}

export function validateCsrfToken(request: NextRequest): boolean {
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  try {
    // Use constant-time comparison to prevent timing attacks
    return timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(cookieToken)
    );
  } catch (error) {
    console.error('CSRF token comparison failed:', error);
    return false;
  }
}

export async function csrfProtection(request: NextRequest) {
  // Skip CSRF check for non-mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return NextResponse.next();
  }

  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}
