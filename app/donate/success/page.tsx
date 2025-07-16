"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Heart } from "lucide-react"
import Link from "next/link"
import type { DonationCampaign } from "@/lib/types"

export default function DonationSuccessPage() {
  const searchParams = useSearchParams()
  const campaignId = searchParams.get("campaign")
  const [campaign, setCampaign] = useState<DonationCampaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
    } else {
      setIsLoading(false)
    }
  }, [campaignId])

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/donations/campaign?id=${campaignId}`)
      const data = await response.json()
      if (response.ok && data.campaign) {
        setCampaign(data.campaign)
      }
    } catch (error) {
      console.error("Error fetching campaign:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A0C878] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFDF6] py-10">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-[#FAF6E9] border-[#DDEB9D] text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl text-[#A0C878] mb-2">
              Thank You for Your Donation!
            </CardTitle>
            <p className="text-gray-600">
              Your generous contribution will make a real difference in our community.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {campaign && (
              <div className="bg-white rounded-lg p-4 border border-[#DDEB9D]">
                <h3 className="font-semibold text-[#A0C878] mb-2">
                  Campaign: {campaign.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {campaign.description}
                </p>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Heart className="h-4 w-4 mr-1 text-red-400" />
                  <span>Your donation helps us reach our goal of MYR {campaign.goalAmount}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• You'll receive a confirmation email shortly</li>
                  <li>• Your donation will be processed securely</li>
                  <li>• We'll keep you updated on the campaign's progress</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-[#A0C878] hover:bg-[#8AB868] text-white flex-1">
                  <Link href="/donate">
                    Make Another Donation
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-[#DDEB9D] text-[#A0C878] hover:bg-[#DDEB9D] flex-1">
                  <Link href="/">
                    Return Home
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 