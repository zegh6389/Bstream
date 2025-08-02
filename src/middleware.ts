import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Temporarily disabled - will implement proper rate limiting later
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/auth/:path*'
  ]
}
