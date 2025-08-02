import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"

export async function POST() {
  try {
    // Check if test user already exists
    const existingUser = await db.user.findUnique({
      where: { email: "test@example.com" }
    })

    if (existingUser) {
      return NextResponse.json({ message: "Test user already exists", user: existingUser })
    }

    // Hash password
    const hashedPassword = await hash("password123", 10)

    // Create test user
    const user = await db.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        emailVerified: new Date(),
        isAdmin: true
      }
    })

    return NextResponse.json({ 
      message: "Test user created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    })
  } catch (error) {
    console.error("Error creating test user:", error)
    return NextResponse.json(
      { error: "Failed to create test user" },
      { status: 500 }
    )
  }
}
