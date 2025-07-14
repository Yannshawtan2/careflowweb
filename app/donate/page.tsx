"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import type { DonationCampaign } from "@/lib/types"

export default function DonateLandingPage() {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
    fetchCampaigns()
  }, [])

  return (
    <div className="min-h-screen bg-[#FFFDF6] py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-[#A0C878] mb-8">Support Our Campaigns</h1>
        {isLoading ? (
          <div className="text-center py-20">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No active donation campaigns at the moment.</div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className="bg-[#FAF6E9] border-[#DDEB9D] flex flex-col">
                {campaign.imageUrl && (
                  <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-48 object-cover rounded-t-md" />
                )}
                <CardHeader>
                  <CardTitle className="text-2xl text-[#A0C878]">{campaign.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="mb-4 text-gray-700">{campaign.description}</p>
                  <div className="mb-4">
                    <Progress value={0} className="h-2 bg-[#FFFDF6] [&>div]:bg-[#A0C878]" />
                    <div className="flex justify-between text-xs mt-1">
                      <span>Raised: MYR 0</span>
                      <span>Goal: MYR {campaign.goal}</span>
                    </div>
                  </div>
                  <Button className="w-full bg-[#A0C878] hover:bg-[#8AB868] text-white" onClick={() => toast.info("Donation flow coming soon!")}>Donate</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 