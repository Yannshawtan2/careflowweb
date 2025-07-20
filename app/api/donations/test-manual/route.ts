import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { campaignId, amount = 50 } = await request.json()
    
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
    }

    console.log('🧪 Creating test donation:', { campaignId, amount })

    // Create a test donation with a fake session ID
    const testSessionId = 'cs_test_manual_' + Date.now()
    
    const testDonation = {
      campaignId,
      amount,
      donorEmail: 'test@example.com',
      donorName: 'Test User',
      message: 'Test donation for manual verification',
      timestamp: new Date().toISOString(),
      paymentIntentId: null,
      status: 'pending' as const,
      sessionId: testSessionId,
    }

    // Add to Firestore
    const donationRef = await adminDb.collection('donations').add(testDonation)
    console.log('✅ Test donation created:', donationRef.id)

    // Now simulate the verification process (like what would happen on success page)
    console.log('🔄 Simulating payment verification...')

    // Update donation status to succeeded
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
      const newTotalRaised = (campaignData?.totalRaised || 0) + amount
      const newDonationCount = (campaignData?.donationCount || 0) + 1

      console.log('📊 Updating campaign totals:', {
        campaignId,
        oldTotal: campaignData?.totalRaised || 0,
        newTotal: newTotalRaised,
        oldCount: campaignData?.donationCount || 0,
        newCount: newDonationCount
      })

      transaction.update(campaignRef, {
        totalRaised: newTotalRaised,
        donationCount: newDonationCount,
        lastUpdated: new Date().toISOString(),
      })
    })

    console.log('✅ Test donation processed successfully')

    return NextResponse.json({
      success: true,
      message: 'Test donation created and processed successfully',
      donation: {
        id: donationRef.id,
        sessionId: testSessionId,
        amount,
        campaignId,
        status: 'succeeded'
      },
      testUrl: `${request.nextUrl.origin}/donate/success?campaign=${campaignId}&session_id=${testSessionId}`
    })

  } catch (error: any) {
    console.error('❌ Test donation error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
