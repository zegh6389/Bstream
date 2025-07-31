"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Lock, 
  Key, 
  Smartphone, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SecuritySettingsProps {
  className?: string
}

export function SecuritySettings({ className }: SecuritySettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<"sms" | "authenticator" | "email">("sms")
  const [sessionTimeout, setSessionTimeout] = useState(120) // minutes
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      
      // Show success message (in real app, you'd use a toast)
      alert("Password updated successfully!")
    } catch (error) {
      console.error("Password change error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTwoFactorToggle = async (enabled: boolean) => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTwoFactorEnabled(enabled)
      
      if (enabled) {
        alert("Two-factor authentication enabled! Please set up your preferred method.")
      } else {
        alert("Two-factor authentication disabled.")
      }
    } catch (error) {
      console.error("2FA toggle error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSessionTimeoutUpdate = async () => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      alert(`Session timeout updated to ${sessionTimeout} minutes`)
    } catch (error) {
      console.error("Session timeout update error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length < 8) return "Weak"
    if (password.length < 12) return "Fair"
    if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return "Strong"
    }
    return "Good"
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "Weak": return "text-red-600 bg-red-100"
      case "Fair": return "text-yellow-600 bg-yellow-100"
      case "Good": return "text-blue-600 bg-blue-100"
      case "Strong": return "text-green-600 bg-green-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-600" />
        <h2 className="text-2xl font-bold">Security Settings</h2>
      </div>

      <Tabs defaultValue="password" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="twofactor">Two-Factor Auth</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
        </TabsList>

        {/* Password Settings */}
        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to maintain account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="pr-10"
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordForm.newPassword && (
                    <div className="flex items-center gap-2">
                      <Badge className={getStrengthColor(getPasswordStrength(passwordForm.newPassword))}>
                        {getPasswordStrength(passwordForm.newPassword)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Must be 8+ characters with uppercase, lowercase, number, and special character
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading || passwordForm.newPassword !== passwordForm.confirmPassword}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                🔒 Encryption & Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">AES-256 Encryption</p>
                      <p className="text-sm text-muted-foreground">All data encrypted at rest and in transit</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Secure Sockets Layer (SSL)</p>
                      <p className="text-sm text-muted-foreground">HTTPS encrypted connections</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Data Backup</p>
                      <p className="text-sm text-muted-foreground">Automated daily backups with encryption</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Two-Factor Authentication */}
        <TabsContent value="twofactor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                🔒 Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Enable Two-Factor Authentication</h4>
                    {!twoFactorEnabled && (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled 
                      ? "Your account is protected with two-factor authentication"
                      : "Add an extra layer of security to prevent unauthorized access"
                    }
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                  disabled={isLoading}
                />
              </div>

              {twoFactorEnabled && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Choose Authentication Method</h4>
                    
                    <div className="grid gap-3">
                      <div 
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          twoFactorMethod === "sms" 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setTwoFactorMethod("sms")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">SMS Verification</p>
                              <p className="text-sm text-muted-foreground">Receive codes via text message</p>
                            </div>
                          </div>
                          {twoFactorMethod === "sms" && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>

                      <div 
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          twoFactorMethod === "authenticator" 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setTwoFactorMethod("authenticator")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Key className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium">Authenticator App</p>
                              <p className="text-sm text-muted-foreground">Use Google Authenticator or similar apps</p>
                            </div>
                          </div>
                          {twoFactorMethod === "authenticator" && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>

                      <div 
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          twoFactorMethod === "email" 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setTwoFactorMethod("email")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="font-medium">Email Backup</p>
                              <p className="text-sm text-muted-foreground">Receive backup codes via email</p>
                            </div>
                          </div>
                          {twoFactorMethod === "email" && (
                            <CheckCircle className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Make sure to save your backup codes in a secure location. You'll need these if you lose access to your authentication method.
                      </AlertDescription>
                    </Alert>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Management */}
        <TabsContent value="session" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                🔒 Session Management
              </CardTitle>
              <CardDescription>
                Control how long your sessions remain active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Session Timeout</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically sign out after {sessionTimeout} minutes of inactivity
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(Number(e.target.value))}
                      className="border rounded px-3 py-1 text-sm"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={240}>4 hours</option>
                      <option value={480}>8 hours</option>
                    </select>
                    <Button 
                      size="sm" 
                      onClick={handleSessionTimeoutUpdate}
                      disabled={isLoading}
                    >
                      Update
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Shorter session timeouts provide better security, while longer timeouts offer more convenience. 
                    We recommend 2 hours for most business users.
                  </AlertDescription>
                </Alert>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Active Sessions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Settings className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">Chrome on Windows • Started now</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">Mobile App</p>
                        <p className="text-sm text-muted-foreground">Safari on iPhone • Started 2 days ago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Terminate</Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Terminate All Other Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}