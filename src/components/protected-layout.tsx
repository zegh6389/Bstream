"use client"

import { useState, useEffect } from "react"
import { AuthSystem } from "@/components/auth-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, Shield, LogOut, Bell } from "lucide-react"
import Link from "next/link"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    setIsLoading(true)
    
    try {
      // Simulate checking authentication status
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, we'll start as unauthenticated
      // In a real app, you would check for a valid session token
      const isAuthenticated = false
      
      if (isAuthenticated) {
        setIsAuthenticated(true)
        setUser({
          id: "user-123",
          email: "demo@example.com",
          name: "Demo User",
          businessName: "Demo Business",
        })
      }
    } catch (error) {
      console.error("Auth check error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthSuccess = (authenticatedUser: any) => {
    setIsAuthenticated(true)
    setUser(authenticatedUser)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthSystem onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="relative">
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* User Info and Security Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.businessName}</p>
              </div>
            </div>
            
            {/* Security Status Badge */}
            <Badge variant="outline" className="text-green-700 border-green-300">
              <Shield className="h-3 w-3 mr-1" />
              🔒 Secured
            </Badge>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            <Link href="/analytics">
              <Button variant="ghost" size="sm">
                Analytics
              </Button>
            </Link>
            
            <Link href="/security">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Security
              </Button>
            </Link>

            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/security">
                    <Settings className="h-4 w-4 mr-2" />
                    Security Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pt-16">
        {children}
      </div>
    </div>
  )
}