"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Icons } from "@/components/ui/icons"
import { useToast } from "@/hooks/use-toast"

const verifySchema = z.object({
  token: z
    .string()
    .min(6, "Token must be 6 digits")
    .max(6, "Token must be 6 digits")
    .regex(/^\d+$/, "Token must contain only numbers"),
})

type VerifyForm = z.infer<typeof verifySchema>

export default function TwoFactorSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string>("")
  const [secret, setSecret] = useState<string>("")
  const [isEnabled, setIsEnabled] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      token: "",
    },
  })

  async function generateSecret() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate 2FA secret")
      }

      const data = await response.json()
      setQrCode(data.qrCode)
      setSecret(data.secret)
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

  async function onSubmit(data: VerifyForm) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          token: data.token,
        }),
      })

      if (!response.ok) {
        throw new Error("Invalid verification code")
      }

      setIsEnabled(true)
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled for your account.",
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
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            {isEnabled
              ? "2FA is now enabled for your account"
              : qrCode
              ? "Scan the QR code and enter the verification code"
              : "Set up two-factor authentication for extra security"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!qrCode && !isEnabled && (
            <>
              <Alert>
                <Icons.info className="h-4 w-4" />
                <AlertTitle>Get Started</AlertTitle>
                <AlertDescription>
                  You'll need an authenticator app like Google Authenticator or Authy to proceed.
                </AlertDescription>
              </Alert>
              <Button
                className="w-full"
                onClick={generateSecret}
                disabled={isLoading}
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Set up 2FA
              </Button>
            </>
          )}

          {qrCode && !isEnabled && (
            <>
              <div className="flex flex-col items-center space-y-4">
                <Image
                  src={qrCode}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Can't scan the QR code? Enter this code manually:
                  </p>
                  <code className="mt-2 block text-sm">{secret}</code>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isLoading}
                            placeholder="000000"
                            maxLength={6}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verify and Enable
                  </Button>
                </form>
              </Form>
            </>
          )}

          {isEnabled && (
            <div className="flex flex-col items-center gap-4">
              <Icons.check className="h-8 w-8 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                Two-factor authentication is now enabled for your account. You'll need to enter a verification code each time you sign in.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            className="px-0"
            onClick={() => router.push("/security")}
          >
            Back to Security Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
