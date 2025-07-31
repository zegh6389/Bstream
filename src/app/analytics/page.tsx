"use client"

import { useState, useEffect } from "react"
import { ProtectedLayout } from "@/components/protected-layout"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { AdminBackupControls } from "@/components/admin-backup-controls"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

export default function AnalyticsPage() {
  const { data: session } = useSession()
  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">Analytics & Insights</h1>
          </div>
          <div className="grid gap-8">
            <AnalyticsDashboard />
            {session?.user?.isAdmin && (
              <div className="p-6 rounded-lg border bg-card">
                <AdminBackupControls />
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}