import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import type { Donation } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    console.log('Manually updating totals for campaign:', campaignId)

    // First, update all pending donations to succeeded (simulate webhook)
    const pendingDonationsSnapshot = await adminDb.collection('donations')
      .where('campaignId', '==', campaignId)
      .where('status', '==', 'pending')
      .get()

    console.log('Found pending donations:', pendingDonationsSnapshot.size)

    // Update pending donations to succeeded
    const batch = adminDb.batch()
    pendingDonationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'succeeded',
        timestamp: new Date().toISOString(),
      })
    })

    if (pendingDonationsSnapshot.size > 0) {
      await batch.commit()
      console.log('Updated', pendingDonationsSnapshot.size, 'pending donations to succeeded')
    }

    // Get all successful donations for this campaign
    const donationsSnapshot = await adminDb.collection('donations')
      .where('campaignId', '==', campaignId)
      .where('status', '==', 'succeeded')
      .get()

    const donations = donationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Donation))

    console.log('Found successful donations:', donations.length)

    // Calculate totals
    const totalRaised = donations.reduce((sum, donation) => sum + donation.amount, 0)
    const donationCount = donations.length

    console.log('Calculated totals:', { totalRaised, donationCount })

    // Update campaign
    const campaignRef = adminDb.collection('campaigns').doc(campaignId)
    await campaignRef.update({
      totalRaised,
      donationCount,
    })

    console.log('Successfully updated campaign totals')

    return NextResponse.json({
      success: true,
      campaignId,
      totalRaised,
      donationCount,
      pendingDonationsUpdated: pendingDonationsSnapshot.size,
      donations: donations.map(d => ({ id: d.id, amount: d.amount, timestamp: d.timestamp }))
    })
  } catch (error: any) {
    console.error('Error updating campaign totals:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Get campaign details
    const campaignDoc = await adminDb.collection('campaigns').doc(campaignId).get()
    if (!campaignDoc.exists) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const campaign = campaignDoc.data()

    // Get all donations for this campaign
    const donationsSnapshot = await adminDb.collection('donations')
      .where('campaignId', '==', campaignId)
      .get()

    const donations = donationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Donation))

    // Calculate actual totals from donations
    const successfulDonations = donations.filter(d => d.status === 'succeeded')
    const actualTotalRaised = successfulDonations.reduce((sum, donation) => sum + donation.amount, 0)
    const actualDonationCount = successfulDonations.length

    return NextResponse.json({
      campaign: {
        id: campaignId,
        ...campaign
      },
      donations: {
        total: donations.length,
        successful: successfulDonations.length,
        failed: donations.filter(d => d.status === 'failed').length,
        pending: donations.filter(d => d.status === 'pending').length,
      },
      totals: {
        current: {
          totalRaised: campaign?.totalRaised || 0,
          donationCount: campaign?.donationCount || 0,
        },
        actual: {
          totalRaised: actualTotalRaised,
          donationCount: actualDonationCount,
        },
        needsUpdate: (campaign?.totalRaised || 0) !== actualTotalRaised || (campaign?.donationCount || 0) !== actualDonationCount
      }
    })
  } catch (error: any) {
    console.error('Error getting campaign totals:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 