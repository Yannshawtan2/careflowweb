"use client"

import { useState, useEffect } from "react"
import { DollarSign, CreditCard, AlertCircle, Calendar, Plus, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RevenueChart } from "@/components/billing/revenue-chart"
import { RecentTransactions } from "@/components/billing/recent-transactions"
import { BillingPlansTable } from "@/components/billing/billing-plans-table"
import { CreateBillingModal } from "@/components/billing/create-billing-modal"
import { BillingReports } from "@/components/billing/billing-reports"
import { billingService } from "@/lib/services/billing-service"
import { toast } from "sonner"

interface BillingMetrics {
  monthlyRevenue: number
  activeSubscriptions: number
  failedPayments: number
  paymentSuccessRate: number
  customerLifetimeValue: number
}

interface GrowthMetrics {
  revenueGrowth: number
  subscriptionGrowth: number
  currentMonthRevenue: number
  previousMonthRevenue: number
}

export function BillingDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null)
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        const [analytics, growth] = await Promise.all([
          billingService.getAnalytics(),
          billingService.getGrowthMetrics()
        ])
        
        setMetrics(analytics.metrics)
        setGrowthMetrics(growth)
      } catch (error: any) {
        console.error('Error fetching metrics:', error)
        toast.error("Error loading billing data", {
          description: "Failed to load billing metrics. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0C878] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading billing data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#A0C878]">Billing Management</h1>
          <p className="text-muted-foreground">Manage recurring billing and subscriptions</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
          <Plus className="mr-2 h-4 w-4" />
          Create Recurring Bill
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#A0C878]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.monthlyRevenue?.toLocaleString() ?? 'Loading...'}</div>
            <p className="text-xs text-muted-foreground">
              <span className={(growthMetrics?.revenueGrowth ?? 0) >= 0 ? "text-green-600" : "text-red-600"}>
                {(growthMetrics?.revenueGrowth ?? 0) >= 0 ? '+' : ''}{(growthMetrics?.revenueGrowth ?? 0).toFixed(1)}%
              </span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-[#A0C878]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeSubscriptions ?? 'Loading...'}</div>
            <p className="text-xs text-muted-foreground">
              <span className={(growthMetrics?.subscriptionGrowth ?? 0) >= 0 ? "text-green-600" : "text-red-600"}>
                {(growthMetrics?.subscriptionGrowth ?? 0) >= 0 ? '+' : ''}{growthMetrics?.subscriptionGrowth ?? 0}
              </span> new this week
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{metrics?.failedPayments ?? 'Loading...'}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[#FAF6E9] border border-[#DDEB9D]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black">
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black"
          >
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black">
            Reports & Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-[#FAF6E9] border-[#DDEB9D]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#A0C878]" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart />
              </CardContent>
            </Card>
            <Card className="col-span-3 bg-[#FAF6E9] border-[#DDEB9D]">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentTransactions />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <BillingPlansTable />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <BillingReports />
        </TabsContent>
      </Tabs>

      {/* Create Billing Modal */}
      <CreateBillingModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} /> 
    </div>
  )
}
