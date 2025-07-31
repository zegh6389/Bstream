import { NextRequest } from "next/server"

// Simple mock authentication for demo purposes
// In a real app, you would use NextAuth.js or similar

export interface User {
  id: string
  email: string
  name?: string
}

export interface Session {
  user: User
}

export async function auth(): Promise<Session | null> {
  // For demo purposes, return a mock user
  // In a real app, you would verify the session token
  return {
    user: {
      id: "demo-user-id",
      email: "demo@example.com",
      name: "Demo User",
    },
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  // Mock sign in - in real app, verify credentials
  return {
    id: "demo-user-id",
    email,
    name: "Demo User",
  }
}

export async function signOut(): Promise<void> {
  // Mock sign out
}