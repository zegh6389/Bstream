import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`
    
    // Count users to verify table exists
    const userCount = await db.user.count()
    
    return NextResponse.json({ 
      status: "ok",
      database: "connected",
      userCount,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Database health check failed:", error)
    return NextResponse.json(
      { 
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
