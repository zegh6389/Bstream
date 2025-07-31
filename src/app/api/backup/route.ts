import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createBackup, restoreBackup } from "@/lib/backup"
import { authOptions } from "@/lib/auth/auth-options"
import { rateLimiter } from "@/lib/rate-limit.new"
import { logAuditEvent, AuditAction } from "@/lib/audit"

const backupSchema = z.object({
  type: z.enum(["full", "incremental"]).default("full"),
})

const restoreSchema = z.object({
  fileName: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !session.user.isAdmin) {
    return new NextResponse("Unauthorized", { status: 403 })
  }

  try {
    const { success } = await rateLimiter.check(req)
    if (!success) {
      return new NextResponse("Too Many Requests", { status: 429 })
    }

    const body = await req.json()
    const { type } = backupSchema.parse(body)

    const result = await createBackup(db, type)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Backup error:", error)
    return new NextResponse(
      "Failed to create backup", 
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !session.user.isAdmin) {
    return new NextResponse("Unauthorized", { status: 403 })
  }

  try {
    const { success } = await rateLimiter.check(req)
    if (!success) {
      return new NextResponse("Too Many Requests", { status: 429 })
    }

    const body = await req.json()
    const { fileName } = restoreSchema.parse(body)

    const result = await restoreBackup(db, fileName)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Restore error:", error)
    return new NextResponse(
      "Failed to restore backup", 
      { status: 500 }
    )
  }
}
