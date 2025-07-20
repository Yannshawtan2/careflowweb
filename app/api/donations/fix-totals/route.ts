import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting campaign totals fix...')

    // Get all campaigns
    const campaignsSnapshot = await adminDb.collection('campaigns').get()
    const results = []

    for (const campaignDoc of campaignsSnapshot.docs) {
      const campaignId = campaignDoc.id
      const campaignData = campaignDoc.data()
      
      console.log(`🎯 Processing campaign: ${campaignData.title} (${campaignId})`)

      // Get all succeeded donations for this campaign
      const donationsSnapshot = await adminDb.collection('donations')
        .where('campaignId', '==', campaignId)
        .where('status', '==', 'succeeded')
        .get()

      // Calculate actual totals
      let actualTotalRaised = 0
      let actualDonationCount = donationsSnapshot.size

      donationsSnapshot.docs.forEach(doc => {
        const donation = doc.data()
        actualTotalRaised += donation.amount
      })

      const currentTotal = campaignData.totalRaised || 0
      const currentCount = campaignData.donationCount || 0

      const result = {
        campaignId,
        title: campaignData.title,
        before: { totalRaised: currentTotal, donationCount: currentCount },
        after: { totalRaised: actualTotalRaised, donationCount: actualDonationCount },
        needsUpdate: currentTotal !== actualTotalRaised || currentCount !== actualDonationCount,
        updated: false
      }

      if (result.needsUpdate) {
        console.log(`🔄 Updating campaign ${campaignId}: ${currentTotal} → ${actualTotalRaised} MYR, ${currentCount} → ${actualDonationCount} donations`)
        
        await campaignDoc.ref.update({
          totalRaised: actualTotalRaised,
          donationCount: actualDonationCount,
          lastUpdated: new Date().toISOString(),
        })

        result.updated = true
      } else {
        result.updated = false
      }

      results.push(result)
    }

    const updatedCount = results.filter(r => r.updated).length
    console.log(`✅ Fixed ${updatedCount} campaigns`)

    return NextResponse.json({
      success: true,
      message: `Fixed ${updatedCount} out of ${results.length} campaigns`,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Campaign totals fix error:', error)
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
