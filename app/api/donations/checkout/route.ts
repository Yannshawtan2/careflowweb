import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import type { PaymentIntentRequest } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: PaymentIntentRequest = await request.json()
    const { campaignId, amount, donorEmail, donorName, message } = body

    // Validate required fields
    if (!campaignId || !amount || !donorEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(donorEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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
    if (!campaign?.active) {
      return NextResponse.json(
        { error: 'Campaign is not active' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: {
              name: `Donation to ${campaign.title}`,
              description: message || `Supporting ${campaign.title}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/donate/success?campaign=${campaignId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/donate?canceled=true`,
      customer_email: donorEmail,
      metadata: {
        campaignId,
        donorEmail,
        donorName: donorName || '',
        message: message || '',
      },
    })

    // Store donation record in Firebase
    const donationData = {
      campaignId,
      amount,
      donorEmail,
      donorName: donorName || '',
      message: message || '',
      timestamp: new Date().toISOString(),
      paymentIntentId: session.payment_intent as string,
      status: 'pending' as const,
      sessionId: session.id,
    }

    await adminDb.collection('donations').add(donationData)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 