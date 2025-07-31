import { Metadata } from "next"
import AdaptiveLoginCard from "@/components/AdaptiveLoginCard"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
}

export default function LoginPage() {
  return (
    <main className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AdaptiveLoginCard />
    </main>
  )
}