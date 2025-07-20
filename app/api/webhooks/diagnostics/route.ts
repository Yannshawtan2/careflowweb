import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Webhook diagnostics requested')
    
    // Check environment variables
    const envCheck = {
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasFirebaseAdmin: !!process.env.FIREBASE_ADMIN_SDK,
    }

    // Check donation status distribution
    const donationsSnapshot = await adminDb.collection('donations').get()
    const statusBreakdown: Record<string, number> = {}
    
    donationsSnapshot.docs.forEach(doc => {
      const donation = doc.data()
      statusBreakdown[donation.status] = (statusBreakdown[donation.status] || 0) + 1
    })

    // Get recent donations
    const recentDonations = donationsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    const diagnostics = {
      environment: envCheck,
      donations: {
        total: donationsSnapshot.size,
        statusBreakdown,
        recentDonations: recentDonations.map((d: any) => ({
          id: d.id,
          status: d.status,
          amount: d.amount,
          timestamp: d.timestamp,
          donorEmail: d.donorEmail,
          campaignId: d.campaignId,
        }))
      },
      webhookEndpoint: `${request.nextUrl.origin}/api/webhooks/stripe`,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(diagnostics)
  } catch (error: any) {
    console.error('❌ Diagnostics error:', error)
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
