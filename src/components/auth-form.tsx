"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/ui/icons"

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string
}

export const AuthForm = React.memo<AuthFormProps>(
  ({ className, callbackUrl: propCallbackUrl, ...props }) => {

const authSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .optional(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
})

type FormData = z.infer<typeof authSchema>

export const AuthForm = React.memo<AuthFormProps>(
  ({ className, callbackUrl: propCallbackUrl, ...props }) => {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      setError,
    } = useForm<FormData>({
      resolver: zodResolver(authSchema),
    })

    const [isGitHubLoading, setIsGitHubLoading] = React.useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)
    const [isSignUp, setIsSignUp] = React.useState(false)
    const searchParams = useSearchParams()
    const router = useRouter()
    const { toast } = useToast()

    const redirectUrl = React.useMemo(
      () => callbackUrl || searchParams?.get("from") || "/",
      [callbackUrl, searchParams]
    )

    const onSubmit = React.useCallback(
      async (data: FormData) => {
        try {
          if (isSignUp) {
            // Handle sign up
            const response = await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.message || "Sign up failed")
            }

            toast({
              title: "Account created",
              description: "Please check your email to verify your account.",
            })
            setIsSignUp(false)
            return
          }

          // Handle sign in
          const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
            callbackUrl: redirectUrl,
          })

          if (!result?.ok) {
            if (result?.error === "CredentialsSignin") {
              setError("password", {
                type: "server",
                message: "Invalid email or password",
              })
            } else {
              toast({
                title: "Authentication failed",
                description: result?.error || "Unable to sign in. Please try again.",
                variant: "destructive",
              })
            }
            return
          }

          if (result.url) {
            router.push(result.url)
          } else {
            router.push(redirectUrl)
          }
        } catch (error) {
          console.error("Auth error:", error)
          toast({
            title: "Something went wrong",
            description: error instanceof Error ? error.message : "An unexpected error occurred.",
            variant: "destructive",
          })
        }
      },
      [isSignUp, redirectUrl, setError, toast, router]
    )

    const handleGitHubSignIn = React.useCallback(async () => {
      if (isGitHubLoading) return
      setIsGitHubLoading(true)
      
      try {
        await signIn("github", { callbackUrl: redirectUrl })
      } catch (error) {
        toast({
          title: "GitHub sign-in failed",
          description: "Unable to connect to GitHub. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsGitHubLoading(false)
      }
    }, [isGitHubLoading, redirectUrl, toast])

    const handleGoogleSignIn = React.useCallback(async () => {
      if (isGoogleLoading) return
      setIsGoogleLoading(true)
      
      try {
        await signIn("google", { callbackUrl: redirectUrl })
      } catch (error) {
        toast({
          title: "Google sign-in failed",
          description: "Unable to connect to Google. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsGoogleLoading(false)
      }
    }, [isGoogleLoading, redirectUrl, toast])

    const isLoading = isSubmitting
    const isAnyLoading = isLoading || isGitHubLoading || isGoogleLoading

    return (
      <div className={cn("grid gap-6", className)} {...props}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            {isSignUp && (
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  type="text"
                  autoComplete="name"
                  disabled={isAnyLoading}
                  {...register("name")}
                />
                {errors?.name && (
                  <p className="text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Enter your email"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isAnyLoading}
                {...register("email")}
              />
              {errors?.email && (
                <p className="text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="Enter your password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                disabled={isAnyLoading}
                {...register("password")}
              />
              {errors?.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={cn(buttonVariants())}
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
            disabled={isAnyLoading}
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }))}
            onClick={handleGitHubSignIn}
            disabled={isAnyLoading}
          >
            {isGitHubLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.gitHub className="mr-2 h-4 w-4" />
            )}
            GitHub
          </button>

          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }))}
            onClick={handleGoogleSignIn}
            disabled={isAnyLoading}
          >
            {isGoogleLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}
            Google
          </button>
        </div>
      </div>
    )
  }
)
)

AuthForm.displayName = "AuthForm"
