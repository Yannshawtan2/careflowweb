"use client"

import { useState, useEffect } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { billingService } from "@/lib/services/billing-service"

export function RevenueChart() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setIsLoading(true)
        // Fetch real historical revenue data from Stripe
        const revenueData = await billingService.getRevenueHistory(6)
        setData(revenueData)
      } catch (error) {
        console.error('Error fetching revenue data:', error)
        // Fallback to empty data
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRevenueData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#A0C878] mr-2"></div>
        <span className="text-muted-foreground">Loading revenue data...</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">No revenue data available</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
                      <span className="font-bold text-muted-foreground">${payload[0].value?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          strokeWidth={2}
          stroke="#A0C878"
          dot={{
            fill: "#A0C878",
          }}
          activeDot={{
            r: 6,
            fill: "#A0C878",
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
