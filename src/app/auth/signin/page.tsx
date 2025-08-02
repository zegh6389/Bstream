import { Metadata } from "next"
import { Suspense } from "react"
import { AuthForm } from "@/components/auth-form-new"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
}

// Force dynamic rendering to avoid build-time issues with useSearchParams
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <main className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/70">Sign in to your account to continue</p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  )
}