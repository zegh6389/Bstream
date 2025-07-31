"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Key, 
  Mail, 
  User, 
  Eye, 
  EyeOff,
  Shield,
  Lock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  Smartphone
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthPromo } from "./auth-promo"

interface AuthSystemProps {
  onAuthSuccess?: (user: any) => void
  className?: string
}

export function AuthSystem({ onAuthSuccess, className }: AuthSystemProps) {
  const [currentView, setCurrentView] = useState<"login" | "register" | "setup">("login")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    businessName: "",
  })



  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock successful login
      const user = {
        id: "user-123",
        email: formData.email,
        name: formData.name || "Demo User",
        businessName: formData.businessName || "Demo Business",
      }

      onAuthSuccess?.(user)
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock successful registration
      setCurrentView("setup")
    } catch (error) {
      console.error("Registration error:", error)
    } finally {
      setIsLoading(false)
    }
  }



  const handleSetupComplete = async () => {
    setIsLoading(true)

    try {
      // Simulate setup completion
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock successful setup
      const user = {
        id: "user-123",
        email: formData.email,
        name: formData.name,
        businessName: formData.businessName,
      }

      onAuthSuccess?.(user)
    } catch (error) {
      console.error("Setup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="remember" className="text-sm">Remember me for 30 days</Label>
          </div>
          <Button variant="link" className="text-sm p-0 h-auto">
            Forgot password?
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Session expires in 2 hours of inactivity
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>



      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Button
            variant="link"
            className="text-sm p-0 h-auto"
            onClick={() => setCurrentView("register")}
          >
            Sign up
          </Button>
        </p>
      </div>
    </form>
  )

  const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="businessName"
              type="text"
              placeholder="Enter your business name"
              value={formData.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="regEmail">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="regEmail"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="regPassword">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="regPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password (min 8 characters)"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="pl-10 pr-10"
              required
              minLength={8}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button
            variant="link"
            className="text-sm p-0 h-auto"
            onClick={() => setCurrentView("login")}
          >
            Sign in
          </Button>
        </p>
      </div>
    </form>
  )

  const renderSetupForm = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Account Created Successfully!</h3>
        <p className="text-sm text-muted-foreground">
          Your Smart AI Accounting account is ready to use
        </p>
      </div>

      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">🔒 Encryption</h4>
                <p className="text-sm text-green-700">
                  Industry-standard data protection with AES-256 encryption for all your financial data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">🔒 Session Management</h4>
                <p className="text-sm text-blue-700">
                  Secure web sessions with automatic timeout and activity monitoring.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">🔒 Password Policies</h4>
                <p className="text-sm text-purple-700">
                  Strong password requirements and regular security updates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900">🔒 Two-Factor Authentication</h4>
                <p className="text-sm text-orange-700">
                  Add extra security with SMS or authenticator app verification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button 
        className="w-full"
        onClick={handleSetupComplete}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting up...
          </>
        ) : (
          "Continue to Dashboard"
        )}
      </Button>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-medium text-blue-900 mb-1">🔒 Two-Factor Authentication</h4>
            <p className="text-blue-700 mb-2">
              Enhance your account security by enabling two-factor authentication in settings.
            </p>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                📱 SMS Verification
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                📱 Authenticator App
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                📧 Email Backup
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn("w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen", className)}>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {currentView === "login" && "Welcome Back"}
                {currentView === "register" && "Create Account"}
                {currentView === "setup" && "Account Setup Complete"}
              </CardTitle>
              <CardDescription>
                {currentView === "login" && "Sign in to access your Smart AI Accounting dashboard"}
                {currentView === "register" && "Start managing your business finances with AI"}
                {currentView === "setup" && "Your account is ready to use"}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              {currentView === "login" && renderLoginForm()}
              {currentView === "register" && renderRegisterForm()}
              {currentView === "setup" && renderSetupForm()}
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <AuthPromo />
      </div>
    </div>
  )
}