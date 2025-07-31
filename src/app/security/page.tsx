"use client"

import { ProtectedLayout } from "@/components/protected-layout"
import { SecuritySettings } from "@/components/security-settings"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SecurityPage() {
  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <SecuritySettings />
        </div>
      </div>
    </ProtectedLayout>
  )
}