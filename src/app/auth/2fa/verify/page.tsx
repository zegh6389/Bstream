"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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

export default function TwoFactorVerifyPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const { toast } = useToast()

  const form = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      token: "",
    },
  })

  async function onSubmit(data: VerifyForm) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.token }),
      })

      if (!response.ok) {
        throw new Error("Invalid verification code")
      }

      toast({
        title: "Verified",
        description: "Two-factor authentication successful.",
      })

      router.push(callbackUrl)
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
          <CardTitle>Two-Factor Verification</CardTitle>
          <CardDescription>
            Enter the verification code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                Verify
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/auth/signin")}
          >
            Back to Sign In
          </Button>
          <Button
            variant="link"
            onClick={() => {
              // Handle backup code flow or support contact
              router.push("/auth/2fa/help")
            }}
          >
            Need Help?
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
