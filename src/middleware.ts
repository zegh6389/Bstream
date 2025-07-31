import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { authLimiter, emailLimiter, resetLimiter, rateLimitMiddleware } from "@/lib/rate-limit"

// Helper to get real IP address
function getIP(request: NextRequest) {
  const xff = request.headers.get('x-forwarded-for')
  return xff ? xff.split(',')[0] : '127.0.0.1'
}

export async function middleware(request: NextRequest) {
  // Only apply to auth-related routes
  if (!request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Apply rate limiting based on the path
  const path = request.nextUrl.pathname
  const ip = getIP(request)
  
  if (path.startsWith('/api/auth/signin') || path.startsWith('/api/auth/callback')) {
    const result = await rateLimitMiddleware(authLimiter, ip)
    if (!result.success) {
      return NextResponse.json(
        { error: "Too many login attempts" },
        { status: 429, headers: { "Retry-After": result.retryAfter.toString() } }
      )
    }
  }

  if (path.startsWith('/api/auth/signup') || path.startsWith('/api/auth/verify-email')) {
    const result = await rateLimitMiddleware(emailLimiter, ip)
    if (!result.success) {
      return NextResponse.json(
        { error: "Too many email verification attempts" },
        { status: 429, headers: { "Retry-After": result.retryAfter.toString() } }
      )
    }
  }

  if (path.startsWith('/api/auth/reset-password')) {
    const result = await rateLimitMiddleware(resetLimiter, ip)
    if (!result.success) {
      return NextResponse.json(
        { error: "Too many password reset attempts" },
        { status: 429, headers: { "Retry-After": result.retryAfter.toString() } }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/auth/:path*'
  ]
}
