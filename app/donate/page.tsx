"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import type { DonationCampaign } from "@/lib/types"
import { DonateModal } from "@/components/donations/donate-modal"
import { DonationHistory } from "@/components/donations/donation-history"
import DefaultHeader from "@/components/DefaultHeader"

export default function DonateLandingPage() {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/donations/campaigns")
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      toast.error("Failed to load donation campaigns")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  // Refresh campaigns when user returns to page (e.g., after donation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page is visible, refresh campaigns
        fetchCampaigns()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <>
    <DefaultHeader />
    <div className="min-h-screen bg-[#FFFDF6] py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-[#A0C878] mb-8">Support Our Campaigns</h1>
        
        {isLoading ? (
          <div className="text-center py-20">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No active donation campaigns at the moment.</div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Campaigns */}
            <div className="lg:col-span-2">
              <div className="grid gap-6 md:grid-cols-2">
                {campaigns.map(campaign => (
                  <Card key={campaign.id} className="bg-[#FAF6E9] border-[#DDEB9D] flex flex-col">
                    {campaign.imageUrl && (
                      <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-48 object-cover rounded-t-md" />
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl text-[#A0C878]">{campaign.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <p className="mb-4 text-gray-700 text-sm">{campaign.description}</p>
                      <div className="mb-4">
                        <Progress 
                          value={campaign.totalRaised ? (campaign.totalRaised / campaign.goalAmount) * 100 : 0} 
                          className="h-2 bg-[#FFFDF6] [&>div]:bg-[#A0C878]" 
                        />
                        <div className="flex justify-between text-xs mt-1">
                          <span>Raised: MYR {campaign.totalRaised || 0}</span>
                          <span>Goal: MYR {campaign.goalAmount}</span>
                        </div>
                      </div>
                      <DonateModal campaign={campaign} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Donation History Sidebar */}
            <div className="lg:col-span-1">
              <DonationHistory limit={5} />
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
} 