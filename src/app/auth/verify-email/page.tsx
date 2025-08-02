"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { useToast } from "@/hooks/use-toast"

// Force dynamic rendering to avoid build-time issues with useSearchParams
export const dynamic = 'force-dynamic'

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  async function verifyEmail(token: string) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", token }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Verification failed")
      }

      setIsVerified(true)
      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified.",
      })
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function resendVerification() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to resend verification email")
      }

      toast({
        title: "Email sent!",
        description: "A new verification email has been sent to your inbox.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {isVerified
              ? "Your email has been verified successfully"
              : token
              ? "Verifying your email address..."
              : "Please verify your email address"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {isLoading ? (
            <Icons.spinner className="h-8 w-8 animate-spin" />
          ) : isVerified ? (
            <div className="flex flex-col items-center gap-4">
              <Icons.check className="h-8 w-8 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                Thank you for verifying your email address. You can now use all features of your account.
              </p>
            </div>
          ) : !token ? (
            <div className="flex flex-col items-center gap-4">
              <Icons.mail className="h-8 w-8" />
              <p className="text-center text-sm text-muted-foreground">
                We sent you a verification email. Click the link in the email to verify your address.
              </p>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {isVerified ? (
            <Button
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          ) : !token ? (
            <>
              <Button
                className="w-full"
                onClick={resendVerification}
                disabled={isLoading}
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Resend Verification Email
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/auth/signin")}
              >
                Back to Sign In
              </Button>
            </>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
