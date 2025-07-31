import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"
import { sendVerificationEmail, verifyEmail } from "@/lib/auth/email"

export async function POST(req: Request) {
  try {
    const { action, token } = await req.json()

    switch (action) {
      case "send":
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
          return new NextResponse("Unauthorized", { status: 401 })
        }
        await sendVerificationEmail(session.user.id, session.user.email)
        return NextResponse.json({ success: true })

      case "verify":
        if (!token) {
          return new NextResponse("Token required", { status: 400 })
        }
        await verifyEmail(token)
        return NextResponse.json({ success: true })

      default:
        return new NextResponse("Invalid action", { status: 400 })
    }
  } catch (error) {
    console.error("Email verification error:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
