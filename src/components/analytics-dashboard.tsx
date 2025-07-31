"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Download,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  overview: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    averageTransaction: number
    transactionCount: number
  }
  trends: {
    revenue: Array<{ date: string; amount: number }>
    expenses: Array<{ date: string; amount: number }>
    profit: Array<{ date: string; amount: number }>
  }
  categories: Array<{
    name: string
    amount: number
    percentage: number
    type: "income" | "expense"
    color: string
  }>
  insights: Array<{
    type: "positive" | "warning" | "info"
    title: string
    description: string
    action?: string
  }>
}

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30d")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock analytics data
      const mockData: AnalyticsData = {
        overview: {
          totalRevenue: 12500,
          totalExpenses: 8750,
          netProfit: 3750,
          profitMargin: 30,
          averageTransaction: 425,
          transactionCount: 42
        },
        trends: {
          revenue: [
            { date: "2024-06-01", amount: 3200 },
            { date: "2024-06-08", amount: 2800 },
            { date: "2024-06-15", amount: 3500 },
            { date: "2024-06-22", amount: 3000 },
            { date: "2024-06-29", amount: 4000 },
            { date: "2024-07-06", amount: 3800 },
            { date: "2024-07-13", amount: 4200 },
            { date: "2024-07-20", amount: 4500 }
          ],
          expenses: [
            { date: "2024-06-01", amount: 2100 },
            { date: "2024-06-08", amount: 1900 },
            { date: "2024-06-15", amount: 2300 },
            { date: "2024-06-22", amount: 2000 },
            { date: "2024-06-29", amount: 2500 },
            { date: "2024-07-06", amount: 2200 },
            { date: "2024-07-13", amount: 2400 },
            { date: "2024-07-20", amount: 2600 }
          ],
          profit: [
            { date: "2024-06-01", amount: 1100 },
            { date: "2024-06-08", amount: 900 },
            { date: "2024-06-15", amount: 1200 },
            { date: "2024-06-22", amount: 1000 },
            { date: "2024-06-29", amount: 1500 },
            { date: "2024-07-06", amount: 1600 },
            { date: "2024-07-13", amount: 1800 },
            { date: "2024-07-20", amount: 1900 }
          ]
        },
        categories: [
          { name: "Sales", amount: 8500, percentage: 68, type: "income", color: "#10b981" },
          { name: "Consulting", amount: 4000, percentage: 32, type: "income", color: "#3b82f6" },
          { name: "Office Supplies", amount: 1200, percentage: 13.7, type: "expense", color: "#ef4444" },
          { name: "Utilities", amount: 800, percentage: 9.1, type: "expense", color: "#f97316" },
          { name: "Marketing", amount: 1500, percentage: 17.1, type: "expense", color: "#8b5cf6" },
          { name: "Software", amount: 900, percentage: 10.3, type: "expense", color: "#06b6d4" },
          { name: "Other", amount: 4350, percentage: 49.7, type: "expense", color: "#6b7280" }
        ],
        insights: [
          {
            type: "positive",
            title: "Revenue Growth",
            description: "Your revenue has increased by 15% compared to last month.",
            action: "View details"
          },
          {
            type: "warning",
            title: "High Marketing Spend",
            description: "Marketing expenses are 23% above budget for this period.",
            action: "Review budget"
          },
          {
            type: "info",
            title: "Profit Margin Improvement",
            description: "Profit margin improved by 3% due to cost optimization.",
            action: "See strategies"
          }
        ]
      }

      setAnalyticsData(mockData)
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-green-50 border-green-200 text-green-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  const renderOverviewCards = () => {
    if (!analyticsData) return null

    const cards = [
      {
        title: "Total Revenue",
        value: formatCurrency(analyticsData.overview.totalRevenue),
        change: "+15.2%",
        trend: "up",
        icon: <TrendingUp className="h-4 w-4 text-green-600" />
      },
      {
        title: "Total Expenses",
        value: formatCurrency(analyticsData.overview.totalExpenses),
        change: "+8.1%",
        trend: "up",
        icon: <CreditCard className="h-4 w-4 text-red-600" />
      },
      {
        title: "Net Profit",
        value: formatCurrency(analyticsData.overview.netProfit),
        change: "+23.5%",
        trend: "up",
        icon: <DollarSign className="h-4 w-4 text-green-600" />
      },
      {
        title: "Profit Margin",
        value: formatPercentage(analyticsData.overview.profitMargin),
        change: "+3.2%",
        trend: "up",
        icon: <Target className="h-4 w-4 text-blue-600" />
      }
    ]

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {card.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1 text-red-600" />
                )}
                {card.change} from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderTrendsChart = () => {
    if (!analyticsData) return null

    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <LineChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Revenue Chart Visualization</p>
                <p className="text-xs text-muted-foreground">
                  Peak: {formatCurrency(Math.max(...analyticsData.trends.revenue.map(t => t.amount)))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Expenses Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Expenses Chart Visualization</p>
                <p className="text-xs text-muted-foreground">
                  Peak: {formatCurrency(Math.max(...analyticsData.trends.expenses.map(t => t.amount)))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Profit Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <LineChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Profit Chart Visualization</p>
                <p className="text-xs text-muted-foreground">
                  Growth: +{formatPercentage(((analyticsData.trends.profit[analyticsData.trends.profit.length - 1].amount - analyticsData.trends.profit[0].amount) / analyticsData.trends.profit[0].amount) * 100)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderCategoryBreakdown = () => {
    if (!analyticsData) return null

    const incomeCategories = analyticsData.categories.filter(c => c.type === "income")
    const expenseCategories = analyticsData.categories.filter(c => c.type === "expense")

    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Income by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incomeCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(category.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatPercentage(category.percentage)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-red-600" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(category.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatPercentage(category.percentage)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderInsights = () => {
    if (!analyticsData) return null

    return (
      <div className="grid gap-4 md:grid-cols-3">
        {analyticsData.insights.map((insight, index) => (
          <Card key={index} className={getInsightColor(insight.type)}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <h4 className="font-medium">{insight.title}</h4>
                <p className="text-sm">{insight.description}</p>
                {insight.action && (
                  <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                    {insight.action} →
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Smart AI Accounting Analytics</h2>
            <p className="text-muted-foreground">Detailed insights into your financial performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Smart AI Accounting Analytics</h2>
          <p className="text-muted-foreground">Detailed insights into your financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverviewCards()}
          {renderInsights()}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {renderOverviewCards()}
          {renderTrendsChart()}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {renderOverviewCards()}
          {renderCategoryBreakdown()}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {renderOverviewCards()}
          {renderInsights()}
          {renderTrendsChart()}
          {renderCategoryBreakdown()}
        </TabsContent>
      </Tabs>
    </div>
  )
}