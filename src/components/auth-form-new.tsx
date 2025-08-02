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

const authSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
})

type FormData = z.infer<typeof authSchema>

function getErrorMessage(error: string): string {
  switch (error) {
    case "CredentialsSignin":
      return "Invalid email or password. Please try again."
    case "AccessDenied":
      return "Access denied. Please contact support."
    case "Verification":
      return "Please check your email for verification."
    default:
      return "An error occurred. Please try again."
  }
}

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
    
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false)
    const [isGitHubLoading, setisGitHubLoading] = React.useState<boolean>(false)
    const searchParams = useSearchParams()
    const router = useRouter()
    const { toast } = useToast()

    // Get callback URL from props or search params
    const callbackUrl = propCallbackUrl || searchParams.get("callbackUrl") || "/dashboard"
    const error = searchParams.get("error")

    React.useEffect(() => {
      if (error) {
        toast({
          title: "Authentication Error",
          description: getErrorMessage(error),
          variant: "destructive",
        })
      }
    }, [error, toast])

    async function onSubmit(data: FormData) {
      setIsLoading(true)

      try {
        const result = await signIn("credentials", {
          email: data.email.toLowerCase(),
          password: data.password,
          redirect: false,
        })

        if (result?.error) {
          const errorMessage = getErrorMessage(result.error)
          setError("root", {
            type: "manual",
            message: errorMessage,
          })
          toast({
            title: "Sign In Failed",
            description: errorMessage,
            variant: "destructive",
          })
        } else if (result?.ok) {
          toast({
            title: "Success",
            description: "You have been signed in successfully.",
          })
          router.push(callbackUrl || "/dashboard")
          router.refresh()
        }
      } catch (error) {
        console.error("Sign in error:", error)
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    async function handleGoogleSignIn() {
      setIsGoogleLoading(true)
      try {
        await signIn("google", { callbackUrl })
      } catch (error) {
        console.error("Google sign in error:", error)
        toast({
          title: "Error",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsGoogleLoading(false)
      }
    }

    async function handleGitHubSignIn() {
      setisGitHubLoading(true)
      try {
        await signIn("github", { callbackUrl })
      } catch (error) {
        console.error("GitHub sign in error:", error)
        toast({
          title: "Error",
          description: "Failed to sign in with GitHub. Please try again.",
          variant: "destructive",
        })
      } finally {
        setisGitHubLoading(false)
      }
    }

    return (
      <div className={cn("grid gap-6", className)} {...props}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading || isGoogleLoading}
                {...register("email")}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              {errors?.email && (
                <p className="px-1 text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                placeholder="Password"
                type="password"
                autoCapitalize="none"
                autoComplete="current-password"
                autoCorrect="off"
                disabled={isLoading || isGoogleLoading}
                {...register("password")}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              {errors?.password && (
                <p className="px-1 text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>
            {errors?.root && (
              <p className="px-1 text-xs text-red-400">
                {errors.root.message}
              </p>
            )}
            <button
              className={cn(buttonVariants(), "bg-white text-black hover:bg-white/90")}
              disabled={isLoading}
              type="submit"
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign In with Email
            </button>
          </div>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-white/70">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid gap-2">
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "bg-white/10 border-white/20 text-white hover:bg-white/20"
            )}
            onClick={handleGitHubSignIn}
            disabled={isGitHubLoading || isGoogleLoading}
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
            className={cn(
              buttonVariants({ variant: "outline" }),
              "bg-white/10 border-white/20 text-white hover:bg-white/20"
            )}
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isGitHubLoading}
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

AuthForm.displayName = "AuthForm"
