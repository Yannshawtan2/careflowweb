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
  const sessionId = searchParams.get("session_id")
  const [campaign, setCampaign] = useState<DonationCampaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
    }
    
    if (sessionId) {
      verifyPayment()
    }
    
    if (!campaignId && !sessionId) {
      setIsLoading(false)
    }
  }, [campaignId, sessionId])

  const verifyPayment = async () => {
    try {
      console.log('🔍 Verifying payment for session:', sessionId)
      
      const response = await fetch('/api/donations/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Payment verified successfully')
        setPaymentVerified(true)
      } else {
        console.error('❌ Payment verification failed:', data.error)
        setVerificationError(data.error)
      }
    } catch (error) {
      console.error('❌ Error verifying payment:', error)
      setVerificationError('Failed to verify payment')
    }
  }

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
              {paymentVerified ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : verificationError ? (
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-500 text-2xl">!</span>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <CardTitle className="text-3xl text-[#A0C878] mb-2">
              {paymentVerified ? "Thank You for Your Donation!" : 
               verificationError ? "Payment Verification Issue" :
               "Processing Your Donation..."}
            </CardTitle>
            <p className="text-gray-600">
              {paymentVerified ? "Your generous contribution will make a real difference in our community." :
               verificationError ? "There was an issue verifying your payment. Please contact support." :
               "We're confirming your payment and updating the campaign totals..."}
            </p>
            {verificationError && (
              <p className="text-red-600 text-sm mt-2">
                Error: {verificationError}
              </p>
            )}
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