import { NextResponse } from "next/server"
import { sendPasswordResetEmail, resetPassword } from "@/lib/auth/email"
import { resetLimiter, checkRateLimit } from "@/lib/rate-limit.new"

export async function POST(req: Request) {
  try {
    const { action, email, token, password } = await req.json()
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1"

    switch (action) {
      case "request":
        if (!email) {
          return NextResponse.json({ error: "Email required" }, { status: 400 })
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
        }

        // Check rate limit
        const rateLimitResult = await checkRateLimit(resetLimiter, `${ip}:${email}`)
        if (!rateLimitResult.success) {
          return NextResponse.json(
            { error: "Too many requests" },
            { 
              status: 429,
              headers: {
                "Retry-After": rateLimitResult.retryAfter?.toString() || "60"
              }
            }
          )
        }

        await sendPasswordResetEmail(email)
        return NextResponse.json({ success: true })

      case "reset":
        if (!token || !password) {
          return new NextResponse("Token and password required", { status: 400 })
        }
        await resetPassword(token, password)
        return NextResponse.json({ success: true })

      default:
        return new NextResponse("Invalid action", { status: 400 })
    }
  } catch (error) {
    console.error("Password reset error:", error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse("Internal error", { status: 500 })
  }
}
