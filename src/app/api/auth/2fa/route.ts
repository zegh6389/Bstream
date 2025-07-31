import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"
import { generateTwoFactorSecret, verifyTwoFactorToken } from "@/lib/auth/two-factor"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { action, token } = await req.json()

    switch (action) {
      case "generate":
        const { secret, qrCode } = await generateTwoFactorSecret(session.user.id)
        return NextResponse.json({ secret, qrCode })

      case "verify":
        if (!token) {
          return new NextResponse("Token required", { status: 400 })
        }
        const isValid = await verifyTwoFactorToken(session.user.id, token)
        return NextResponse.json({ success: isValid })

      default:
        return new NextResponse("Invalid action", { status: 400 })
    }
  } catch (error) {
    console.error("2FA error:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
