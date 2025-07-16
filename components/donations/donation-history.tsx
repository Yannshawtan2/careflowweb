"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, User, MessageCircle } from "lucide-react"
import type { Donation } from "@/lib/types"

interface DonationHistoryProps {
  campaignId?: string
  limit?: number
}

export function DonationHistory({ campaignId, limit = 10 }: DonationHistoryProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDonations()
  }, [campaignId, limit])

  const fetchDonations = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (campaignId) params.append('campaignId', campaignId)
      params.append('limit', limit.toString())
      
      const response = await fetch(`/api/donations/history?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setDonations(data.donations || [])
      }
    } catch (error) {
      console.error('Error fetching donations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
        <CardHeader>
          <CardTitle className="text-[#A0C878]">Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0C878] mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading donations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (donations.length === 0) {
    return (
      <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
        <CardHeader>
          <CardTitle className="text-[#A0C878]">Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No donations yet. Be the first to make a difference!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
      <CardHeader>
        <CardTitle className="text-[#A0C878] flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Recent Donations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {donations.map((donation) => (
            <div key={donation.id} className="bg-white rounded-lg p-4 border border-[#DDEB9D]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {donation.donorName || 'Anonymous'}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {formatAmount(donation.amount)}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(donation.timestamp)}
                </span>
              </div>
              
              {donation.message && (
                <div className="flex items-start gap-2 mt-2">
                  <MessageCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600 italic">
                    "{donation.message}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 