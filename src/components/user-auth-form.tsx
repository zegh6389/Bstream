"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
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

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string
}

// Enhanced validation schema with more robust email validation
const userAuthSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(254, "Email address is too long") // RFC 5321 limit
    .transform((email) => email.toLowerCase().trim()),
})

type FormData = z.infer<typeof userAuthSchema>

// Rate limiting state (in production, implement server-side)
const useRateLimiting = () => {
  const [attempts, setAttempts] = React.useState(0)
  const [lastAttempt, setLastAttempt] = React.useState<number>(0)
  const maxAttempts = 5
  const cooldownMs = 60000 // 1 minute

  const canAttempt = React.useMemo(() => {
    const now = Date.now()
    if (now - lastAttempt > cooldownMs) {
      return true
    }
    return attempts < maxAttempts
  }, [attempts, lastAttempt])

  const recordAttempt = React.useCallback(() => {
    const now = Date.now()
    if (now - lastAttempt > cooldownMs) {
      setAttempts(1)
    } else {
      setAttempts((prev) => prev + 1)
    }
    setLastAttempt(now)
  }, [lastAttempt])

  return { canAttempt, recordAttempt, attempts, maxAttempts }
}

export const UserAuthForm = React.memo<UserAuthFormProps>(
  ({ className, callbackUrl, ...props }) => {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      setError,
      reset,
    } = useForm<FormData>({
      resolver: zodResolver(userAuthSchema),
      defaultValues: {
        email: "",
      },
    })

    const [isEmailLoading, setIsEmailLoading] = React.useState(false)
    const [isGitHubLoading, setIsGitHubLoading] = React.useState(false)
    const [emailSent, setEmailSent] = React.useState(false)
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const { canAttempt, recordAttempt, attempts, maxAttempts } = useRateLimiting()

    // Get callback URL with fallback
    const redirectUrl = React.useMemo(
      () => callbackUrl || searchParams?.get("from") || "/dashboard",
      [callbackUrl, searchParams]
    )

    const onSubmit = React.useCallback(
      async (data: FormData) => {
        if (!canAttempt) {
          toast({
            title: "Too many attempts",
            description: `Please wait before trying again. (${attempts}/${maxAttempts} attempts used)`,
            variant: "destructive",
          })
          return
        }

        setIsEmailLoading(true)
        recordAttempt()

        try {
          const signInResult = await signIn("email", {
            email: data.email,
            redirect: false,
            callbackUrl: redirectUrl,
          })

          if (!signInResult?.ok) {
            if (signInResult?.error === "EmailCreateError") {
              setError("email", {
                type: "server",
                message: "Failed to send email. Please check your email address.",
              })
            } else {
              toast({
                title: "Authentication failed",
                description:
                  signInResult?.error ||
                  "Unable to send sign-in email. Please try again.",
                variant: "destructive",
              })
            }
            return
          }

          setEmailSent(true)
          toast({
            title: "Check your email",
            description:
              "We've sent you a secure sign-in link. Check your spam folder if you don't see it.",
          })

          // Reset form after successful submission
          reset()
        } catch (error) {
          console.error("Auth error:", error)
          toast({
            title: "Something went wrong",
            description:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsEmailLoading(false)
        }
      },
      [
        canAttempt,
        toast,
        recordAttempt,
        attempts,
        maxAttempts,
        redirectUrl,
        setError,
        reset,
      ]
    )

    const handleGitHubSignIn = React.useCallback(async () => {
      if (isGitHubLoading || isEmailLoading) return

      setIsGitHubLoading(true)

      try {
        await signIn("github", {
          callbackUrl: redirectUrl,
          redirect: false,
        })
      } catch (error) {
        console.error("GitHub auth error:", error)
        toast({
          title: "GitHub sign-in failed",
          description: "Unable to connect to GitHub. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsGitHubLoading(false)
      }
    }, [isGitHubLoading, isEmailLoading, redirectUrl, toast])

    const isLoading = isEmailLoading || isSubmitting
    const isAnyLoading = isLoading || isGitHubLoading

    return (
      <div className={cn("grid gap-6", className)} {...props}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          aria-label="Email authentication form"
          noValidate
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                placeholder="Enter your email address"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isAnyLoading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={cn(
                  errors.email && "border-red-500 focus:border-red-500"
                )}
                {...register("email")}
              />
              {errors?.email && (
                <p
                  id="email-error"
                  className="text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={cn(buttonVariants())}
              disabled={isLoading || !canAttempt}
              aria-describedby={!canAttempt ? "rate-limit-message" : undefined}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {emailSent ? "Resend Email" : "Sign In with Email"}
            </button>

            {!canAttempt && (
              <p
                id="rate-limit-message"
                className="text-sm text-amber-600"
                role="alert"
              >
                Too many attempts. Please wait before trying again.
              </p>
            )}
          </div>
        </form>

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

        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={handleGitHubSignIn}
          disabled={isAnyLoading}
          aria-label="Sign in with GitHub"
        >
          {isGitHubLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.gitHub className="mr-2 h-4 w-4" />
          )}
          GitHub
        </button>
      </div>
    )
  }
)

UserAuthForm.displayName = "UserAuthForm"