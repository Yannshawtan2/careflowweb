import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    console.log('🔍 Verifying payment session:', sessionId)

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    console.log('💳 Session status:', session.payment_status)

    // Only process if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Find the existing donation record
    const donationsSnapshot = await adminDb.collection('donations')
      .where('sessionId', '==', sessionId)
      .get()

    if (donationsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Donation record not found' },
        { status: 404 }
      )
    }

    const donationDoc = donationsSnapshot.docs[0]
    const donationData = donationDoc.data()

    // Check if already processed
    if (donationData.status === 'succeeded') {
      console.log('✅ Donation already processed')
      return NextResponse.json({
        success: true,
        message: 'Donation already processed',
        donation: { id: donationDoc.id, ...donationData }
      })
    }

    console.log('🔄 Processing donation:', donationDoc.id)

    // Update donation status to succeeded
    await donationDoc.ref.update({
      status: 'succeeded',
      timestamp: new Date().toISOString(),
      paymentIntentId: session.payment_intent as string,
    })

    // Update campaign totals
    const campaignRef = adminDb.collection('campaigns').doc(donationData.campaignId)
    
    await adminDb.runTransaction(async (transaction) => {
      const campaignDoc = await transaction.get(campaignRef)
      if (!campaignDoc.exists) {
        throw new Error('Campaign not found')
      }

      const campaignData = campaignDoc.data()
      const newTotalRaised = (campaignData?.totalRaised || 0) + donationData.amount
      const newDonationCount = (campaignData?.donationCount || 0) + 1

      console.log('📊 Updating campaign totals:', {
        campaignId: donationData.campaignId,
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

    console.log('✅ Successfully processed donation')

    return NextResponse.json({
      success: true,
      message: 'Donation processed successfully',
      donation: {
        id: donationDoc.id,
        amount: donationData.amount,
        campaignId: donationData.campaignId,
        status: 'succeeded'
      }
    })

  } catch (error: any) {
    console.error('❌ Error verifying payment:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
