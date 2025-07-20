import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 Processing pending donations manually...')

    // Get all pending donations
    const pendingSnapshot = await adminDb.collection('donations')
      .where('status', '==', 'pending')
      .get()

    if (pendingSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No pending donations to process',
        processed: 0
      })
    }

    console.log(`📋 Found ${pendingSnapshot.size} pending donations`)

    const campaignUpdates: Record<string, { totalAmount: number, count: number }> = {}
    const processedDonations = []

    // Process each pending donation
    const batch = adminDb.batch()
    
    for (const donationDoc of pendingSnapshot.docs) {
      const donation = donationDoc.data()
      
      console.log(`💰 Processing: ${donation.amount} MYR from ${donation.donorEmail}`)
      
      // Update donation status to succeeded
      batch.update(donationDoc.ref, {
        status: 'succeeded',
        timestamp: new Date().toISOString(),
      })

      // Track campaign updates
      if (!campaignUpdates[donation.campaignId]) {
        campaignUpdates[donation.campaignId] = { totalAmount: 0, count: 0 }
      }
      campaignUpdates[donation.campaignId].totalAmount += donation.amount
      campaignUpdates[donation.campaignId].count += 1

      processedDonations.push({
        id: donationDoc.id,
        amount: donation.amount,
        campaignId: donation.campaignId,
        donorEmail: donation.donorEmail
      })
    }

    // Commit donation status updates
    await batch.commit()
    console.log(`✅ Updated ${pendingSnapshot.size} donations to succeeded`)

    // Update campaign totals
    const campaignResults: Array<{
      campaignId: string
      title: string
      added: { amount: number, count: number }
      newTotals: { totalRaised: number, donationCount: number }
    }> = []
    for (const [campaignId, updates] of Object.entries(campaignUpdates)) {
      const campaignRef = adminDb.collection('campaigns').doc(campaignId)
      
      await adminDb.runTransaction(async (transaction) => {
        const campaignDoc = await transaction.get(campaignRef)
        if (!campaignDoc.exists) {
          throw new Error(`Campaign not found: ${campaignId}`)
        }

        const campaignData = campaignDoc.data()
        const newTotalRaised = (campaignData?.totalRaised || 0) + updates.totalAmount
        const newDonationCount = (campaignData?.donationCount || 0) + updates.count

        console.log(`📊 Updating campaign ${campaignId}:`)
        console.log(`   Adding: ${updates.totalAmount} MYR, ${updates.count} donations`)
        console.log(`   New totals: ${newTotalRaised} MYR, ${newDonationCount} donations`)

        transaction.update(campaignRef, {
          totalRaised: newTotalRaised,
          donationCount: newDonationCount,
          lastUpdated: new Date().toISOString(),
        })

        campaignResults.push({
          campaignId,
          title: campaignData?.title,
          added: { amount: updates.totalAmount, count: updates.count },
          newTotals: { totalRaised: newTotalRaised, donationCount: newDonationCount }
        })
      })
    }

    console.log(`🎉 Successfully processed ${pendingSnapshot.size} pending donations`)

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${pendingSnapshot.size} pending donations`,
      processed: pendingSnapshot.size,
      donations: processedDonations,
      campaignUpdates: campaignResults,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Error processing pending donations:', error)
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
