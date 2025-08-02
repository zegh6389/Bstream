import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import { db } from "@/lib/db"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { validateTwoFactorToken } from "./two-factor"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/auth/new-user",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        }
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          emailVerified: new Date(), // GitHub emails are verified by default
        }
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Auth failed: Missing credentials")
          throw new Error("Invalid credentials")
        }

        console.log("Attempting to authenticate user:", credentials.email)

        try {
          const user = await db.user.findUnique({
            where: {
              email: credentials.email,
            },
          })

          if (!user || !user.password) {
            console.log("Auth failed: User not found or no password set")
            throw new Error("Invalid credentials")
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            console.log("Auth failed: Invalid password")
            throw new Error("Invalid credentials")
          }

          if (!user.emailVerified) {
            console.log("Auth failed: Email not verified")
            throw new Error("Please verify your email first")
          }

          console.log("Auth successful for user:", user.email)
          return user
        } catch (error) {
          console.error("Database auth error:", error)
          throw new Error("Authentication failed")
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider === "google" || account?.provider === "github") {
        return true
      }

      // For credentials, check email verification and 2FA
      if (account?.provider === "credentials") {
        // If the user object is not available, it means authorize failed
        if (!user) {
          return false
        }
        
        if (!(user as any).emailVerified) {
          throw new Error("Please verify your email first")
        }

        if ((user as any).twoFactorEnabled) {
          // Redirect to 2FA verification
          return `/auth/2fa/verify?callbackUrl=${encodeURIComponent("/dashboard")}`
        }
      }

      return true
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        session.user.emailVerified = token.emailVerified as Date | null
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.emailVerified = (user as any).emailVerified
        token.isAdmin = (user as any).isAdmin ?? false
      }

      if (account) {
        token.provider = account.provider
      }

      return token
    },
  },
}
