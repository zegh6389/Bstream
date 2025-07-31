"use client"

import { useState, useEffect } from "react"
import { ProtectedLayout } from "@/components/protected-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TransactionList } from "@/components/transaction-list"
import { VoiceAssistant } from "@/components/voice-assistant"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Plus, 
  Mic, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Users,
  Building2
} from "lucide-react"

interface Transaction {
  id: string
  vendor: string
  category: string
  amount: number
  date: string
  type: "income" | "expense"
  status: "completed" | "pending"
}

interface MetricCard {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: React.ReactNode
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("User")
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMetrics([
        {
          title: "Account Balance",
          value: "$1,250",
          change: "+12.5%",
          trend: "up",
          icon: <TrendingUp className="h-4 w-4 text-green-600" />
        },
        {
          title: "Total Income (MTD)",
          value: "$5,000",
          change: "+8.2%",
          trend: "up",
          icon: <DollarSign className="h-4 w-4 text-green-600" />
        },
        {
          title: "Total Expenses (MTD)",
          value: "$3,750",
          change: "-3.1%",
          trend: "down",
          icon: <CreditCard className="h-4 w-4 text-red-600" />
        },
        {
          title: "Profit Margin",
          value: "25%",
          change: "+2.1%",
          trend: "up",
          icon: <BarChart3 className="h-4 w-4 text-blue-600" />
        }
      ])

      setRecentTransactions([
        {
          id: "1",
          vendor: "Staples",
          category: "Office Supplies",
          amount: -45.50,
          date: "2024-07-28",
          type: "expense",
          status: "completed"
        },
        {
          id: "2",
          vendor: "Client A",
          category: "Consulting",
          amount: 1500.00,
          date: "2024-07-27",
          type: "income",
          status: "completed"
        },
        {
          id: "3",
          vendor: "Electricity Bill",
          category: "Utilities",
          amount: -120.00,
          date: "2024-07-26",
          type: "expense",
          status: "completed"
        },
        {
          id: "4",
          vendor: "Client B",
          category: "Sales",
          amount: 2000.00,
          date: "2024-07-25",
          type: "income",
          status: "completed"
        },
        {
          id: "5",
          vendor: "Travel Agency",
          category: "Travel",
          amount: -300.00,
          date: "2024-07-24",
          type: "expense",
          status: "pending"
        }
      ])

      setIsLoading(false)
    }

    loadData()
  }, [])

  const formatAmount = (amount: number) => {
    return `${amount < 0 ? "-" : "+"}$${Math.abs(amount).toFixed(2)}`
  }

  const getTransactionColor = (amount: number) => {
    return amount < 0 ? "text-red-600" : "text-green-600"
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 pt-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Good morning, {userName}</h1>
              <p className="text-muted-foreground">Here's your Smart AI Accounting overview</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/analytics">
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
  
              <Button size="sm">
                <Mic className="h-4 w-4 mr-2" />
                Voice Assistant
              </Button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-16 mt-2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              metrics.map((metric, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                    {metric.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      {metric.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1 text-red-600" />
                      )}
                      {metric.change} from last month
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-1">
            {/* Transaction List */}
            <TransactionList />
          </div>
        </div>
        
        {/* Voice Assistant */}
        <VoiceAssistant />
      </div>
    </ProtectedLayout>
  )
}