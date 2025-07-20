import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { campaignId } = await request.json()
    
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
    }

    console.log('🧪 Testing donation flow for campaign:', campaignId)
    // Create a test donation
    const testDonation = {
      campaignId,
      amount: 10,
      donorEmail: 'test@example.com',
      donorName: 'Test Donor',
      message: 'Test donation via manual trigger',
      timestamp: new Date().toISOString(),
      paymentIntentId: 'test_pi_' + Date.now(),
      status: 'pending' as const,
      sessionId: 'test_session_' + Date.now(),
    }

    // Add to Firestore
    const donationRef = await adminDb.collection('donations').add(testDonation)
    console.log('✅ Test donation created:', donationRef.id)

    // Simulate webhook processing
    await donationRef.update({
      status: 'succeeded',
      timestamp: new Date().toISOString(),
    })

    // Update campaign totals
    const campaignRef = adminDb.collection('campaigns').doc(campaignId)
    
    await adminDb.runTransaction(async (transaction) => {
      const campaignDoc = await transaction.get(campaignRef)
      if (!campaignDoc.exists) {
        throw new Error('Campaign not found')
      }

      const campaignData = campaignDoc.data()
      const newTotalRaised = (campaignData?.totalRaised || 0) + testDonation.amount
      const newDonationCount = (campaignData?.donationCount || 0) + 1

      transaction.update(campaignRef, {
        totalRaised: newTotalRaised,
        donationCount: newDonationCount,
      })

      console.log('📊 Updated campaign totals:', {
        oldTotal: campaignData?.totalRaised || 0,
        newTotal: newTotalRaised,
        oldCount: campaignData?.donationCount || 0,
        newCount: newDonationCount
      })
    })

    return NextResponse.json({
      success: true,
      donationId: donationRef.id,
      message: 'Test donation created and processed successfully'
    })

  } catch (error: any) {
    console.error('❌ Test donation error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
