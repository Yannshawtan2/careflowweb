"use client"

import { useState, useEffect } from "react"
import { Download, TrendingUp, Users, DollarSign, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, PieChart, Cell } from "recharts"
import { billingService } from "@/lib/services/billing-service"
import { toast } from "sonner"

export function BillingReports() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2024, 0, 1),
    to: new Date(),
  })
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [failedPaymentsData, setFailedPaymentsData] = useState<any[]>([])
  const [growthMetrics, setGrowthMetrics] = useState<any>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        const [analyticsData, revenueHistory, failedPayments, growth] = await Promise.all([
          billingService.getAnalytics(),
          billingService.getRevenueHistory(6),
          billingService.getFailedPayments(),
          billingService.getGrowthMetrics()
        ])
        
        setAnalytics(analyticsData)
        setRevenueData(revenueHistory)
        setFailedPaymentsData(failedPayments)
        setGrowthMetrics(growth)
      } catch (error: any) {
        console.error('Error fetching analytics:', error)
        toast.error("Error loading analytics", {
          description: "Failed to load analytics data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  // Transform plan distribution data for the pie chart
  const planTypeData = analytics?.planDistribution ? 
    Object.entries(analytics.planDistribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: name === 'monthly' ? "#A0C878" : name === 'quarterly' ? "#DDEB9D" : "#FAF6E9"
    })) : []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0C878] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#A0C878]">Billing Reports & Analytics</h2>
          <p className="text-muted-foreground">Comprehensive billing insights and reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[180px] bg-white border-[#DDEB9D] focus:ring-[#A0C878]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-[#DDEB9D] hover:bg-[#DDEB9D] hover:text-black">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#A0C878]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.metrics?.monthlyRevenue?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              <span className={(growthMetrics?.revenueGrowth ?? 0) >= 0 ? "text-green-600" : "text-red-600"}>
                {(growthMetrics?.revenueGrowth ?? 0) >= 0 ? '+' : ''}{(growthMetrics?.revenueGrowth ?? 0).toFixed(1)}%
              </span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Lifetime Value</CardTitle>
            <Users className="h-4 w-4 text-[#A0C878]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.metrics?.customerLifetimeValue?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">Average per guardian</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.3%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.metrics?.paymentSuccessRate || '0'}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="bg-[#FAF6E9] border border-[#DDEB9D]">
          <TabsTrigger value="revenue" className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black">
            Revenue Trends
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black">
            Plan Distribution
          </TabsTrigger>
          <TabsTrigger value="failures" className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black">
            Failed Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
            <CardHeader>
              <CardTitle>Revenue & Subscription Growth</CardTitle>
              <CardDescription>Monthly revenue and subscription count over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="revenue" orientation="left" />
                  <YAxis yAxisId="subscriptions" orientation="right" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
                                <span className="font-bold">Revenue: ${payload[0]?.value?.toLocaleString()}</span>
                                <span className="font-bold">Subscriptions: {payload[1]?.value || 0}</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar yAxisId="revenue" dataKey="revenue" fill="#A0C878" name="Revenue" />
                  <Bar yAxisId="subscriptions" dataKey="subscriptions" fill="#DDEB9D" name="Subscriptions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
            <CardHeader>
              <CardTitle>Subscription Plan Distribution</CardTitle>
              <CardDescription>Breakdown of subscription types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={planTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures" className="space-y-4">
          <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
            <CardHeader>
              <CardTitle>Failed Payment Analysis</CardTitle>
              <CardDescription>Breakdown of payment failure reasons</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={failedPaymentsData} layout="horizontal">
                  <XAxis type="number" />
                  <YAxis dataKey="reason" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
