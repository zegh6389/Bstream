"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Icons } from "@/components/ui/icons"
import { useToast } from "@/hooks/use-toast"

const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type RequestResetForm = z.infer<typeof requestResetSchema>

export default function RequestResetPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: RequestResetForm) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          email: data.email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send reset email")
      }

      setIsSubmitted(true)
      toast({
        title: "Reset email sent",
        description: "If an account exists with this email, you will receive a password reset link.",
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
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {isSubmitted
              ? "Please check your email for a reset link"
              : "Enter your email address to reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" role="form">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isLoading}
                          type="email"
                          placeholder="name@example.com"
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
                  Send Reset Link
                </Button>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Icons.mail className="h-8 w-8 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                If an account exists with this email address, you will receive a password reset link shortly.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            className="px-0"
            onClick={() => router.push("/auth/signin")}
          >
            Back to Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
