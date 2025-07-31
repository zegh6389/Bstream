import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      emailVerified?: Date | null
      isAdmin: boolean
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    emailVerified?: Date | null
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
    email?: string | null
    name?: string | null
    picture?: string | null
    emailVerified?: Date | null
    provider?: string
  }
}
