import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"
import type { Session } from "next-auth"

export type { Session }

export async function auth(): Promise<Session | null> {
  return await getServerSession(authOptions)
}

export { signIn, signOut } from "next-auth/react"