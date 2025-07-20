import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = (await headers()).get('stripe-signature')

    console.log('🎯 Webhook received:', {
      hasSignature: !!signature,
      bodyLength: body.length,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
    })

    if (!signature) {
      console.error('❌ No signature found in webhook headers')
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET environment variable not set')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('✅ Webhook event verified:', event.type, 'ID:', event.id)

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      case 'checkout.session.completed':
        console.log('Processing checkout.session.completed event')
        await handleCheckoutSessionCompleted(event.data.object)
        break
      case 'payment_intent.succeeded':
        console.log('Processing payment_intent.succeeded event')
        await handlePaymentIntentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('Invoice payment succeeded:', invoice.id)
  
  if (invoice.subscription) {
    // Update subscription status in your database if needed
    console.log('Subscription payment succeeded:', invoice.subscription)
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log('Invoice payment failed:', invoice.id)
  
  if (invoice.subscription) {
    // Handle failed payment
    console.log('Subscription payment failed:', invoice.subscription)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Subscription updated:', subscription.id, subscription.status)
  
  // Update subscription in your database
  try {
    // Find the user with this subscription
    const usersSnapshot = await adminDb.collection('users').get()
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data()
      if (userData.stripeCustomerId === subscription.customer) {
        // Update user's subscription status
        await doc.ref.update({
          'subscriptionStatus': subscription.status,
          'subscriptionId': subscription.id,
          'lastUpdated': new Date(),
        })
        console.log('Updated user subscription status:', doc.id, subscription.status)
        break
      }
    }
  } catch (error) {
    console.error('Error updating subscription in database:', error)
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Subscription deleted:', subscription.id)
  
  // Handle subscription deletion
  try {
    const usersSnapshot = await adminDb.collection('users').get()
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data()
      if (userData.stripeCustomerId === subscription.customer) {
        await doc.ref.update({
          'subscriptionStatus': 'canceled',
          'lastUpdated': new Date(),
        })
        console.log('Marked user subscription as canceled:', doc.id)
        break
      }
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

// Helper function to update campaign totals
async function updateCampaignTotals(campaignId: string, amount: number, donationCount: number) {
  console.log('💰 Updating campaign totals:', { campaignId, amount, donationCount })
  
  const campaignRef = adminDb.collection('campaigns').doc(campaignId)
  
  // Use transaction to ensure atomic updates
  await adminDb.runTransaction(async (transaction) => {
    const campaignDoc = await transaction.get(campaignRef)
    if (!campaignDoc.exists) {
      throw new Error(`Campaign not found: ${campaignId}`)
    }

    const campaignData = campaignDoc.data()
    const newTotalRaised = (campaignData?.totalRaised || 0) + amount
    const newDonationCount = (campaignData?.donationCount || 0) + donationCount

    console.log('📊 Campaign totals update:', {
      currentTotal: campaignData?.totalRaised || 0,
      addingAmount: amount,
      newTotal: newTotalRaised,
      currentCount: campaignData?.donationCount || 0,
      addingCount: donationCount,
      newCount: newDonationCount
    })

    transaction.update(campaignRef, {
      totalRaised: newTotalRaised,
      donationCount: newDonationCount,
    })
  })
  
  console.log('✅ Campaign totals updated successfully')
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log('🎉 Checkout session completed:', session.id)
  console.log('📝 Session metadata:', JSON.stringify(session.metadata, null, 2))
  
  try {
    // Find the donation record by session ID
    const donationsSnapshot = await adminDb.collection('donations')
      .where('sessionId', '==', session.id)
      .get()

    if (donationsSnapshot.empty) {
      console.error('❌ No donation record found for session:', session.id)
      
      // Try to create donation from session metadata if it doesn't exist
      if (session.metadata && session.metadata.campaignId) {
        console.log('🔄 Attempting to create donation from session metadata...')
        const donationData = {
          campaignId: session.metadata.campaignId,
          amount: session.amount_total / 100, // Convert from cents
          donorEmail: session.metadata.donorEmail || session.customer_email,
          donorName: session.metadata.donorName || '',
          message: session.metadata.message || '',
          timestamp: new Date().toISOString(),
          paymentIntentId: session.payment_intent as string,
          status: 'succeeded' as const,
          sessionId: session.id,
        }

        const newDonationRef = await adminDb.collection('donations').add(donationData)
        console.log('✅ Created donation from session metadata:', newDonationRef.id)
        
        // Update campaign totals
        await updateCampaignTotals(donationData.campaignId, donationData.amount, 1)
        return
      }
      
      console.error('❌ Cannot create donation - insufficient metadata')
      return
    }

    const donationDoc = donationsSnapshot.docs[0]
    const donationData = donationDoc.data()
    console.log('✅ Found donation record:', {
      id: donationDoc.id,
      amount: donationData.amount,
      status: donationData.status,
      campaignId: donationData.campaignId
    })

    // Check if already processed
    if (donationData.status === 'succeeded') {
      console.log('⚠️  Donation already processed, skipping:', donationDoc.id)
      return
    }

    // Update donation status
    await donationDoc.ref.update({
      status: 'succeeded',
      timestamp: new Date().toISOString(),
    })
    console.log('✅ Updated donation status to succeeded:', donationDoc.id)

    // Update campaign totals
    await updateCampaignTotals(donationData.campaignId, donationData.amount, 1)

    console.log('🎯 Successfully processed checkout session completion:', {
      donationId: donationDoc.id,
      campaignId: donationData.campaignId,
      amount: donationData.amount,
    })
  } catch (error) {
    console.error('❌ Error handling checkout session completion:', error)
    throw error // Re-throw to be caught by main handler
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log('💳 Payment intent succeeded:', paymentIntent.id)
  console.log('💳 Payment intent metadata:', JSON.stringify(paymentIntent.metadata, null, 2))
  
  try {
    // First try to find by payment intent ID
    let donationsSnapshot = await adminDb.collection('donations')
      .where('paymentIntentId', '==', paymentIntent.id)
      .get()

    // If not found, try to find by session ID (for checkout sessions)
    if (donationsSnapshot.empty && paymentIntent.metadata?.session_id) {
      console.log('🔍 Trying to find donation by session ID:', paymentIntent.metadata.session_id)
      donationsSnapshot = await adminDb.collection('donations')
        .where('sessionId', '==', paymentIntent.metadata.session_id)
        .get()
    }

    if (donationsSnapshot.empty) {
      console.error('❌ No donation record found for payment intent:', paymentIntent.id)
      console.log('💡 Available metadata:', paymentIntent.metadata)
      return
    }

    const donationDoc = donationsSnapshot.docs[0]
    const donationData = donationDoc.data()
    console.log('✅ Found donation record:', {
      id: donationDoc.id,
      amount: donationData.amount,
      status: donationData.status,
      campaignId: donationData.campaignId
    })

    // Check if already processed
    if (donationData.status === 'succeeded') {
      console.log('⚠️  Donation already processed, skipping:', donationDoc.id)
      return
    }

    // Update donation status
    await donationDoc.ref.update({
      status: 'succeeded',
      timestamp: new Date().toISOString(),
    })
    console.log('✅ Updated donation status to succeeded:', donationDoc.id)

    // Update campaign totals
    await updateCampaignTotals(donationData.campaignId, donationData.amount, 1)

    console.log('🎯 Successfully processed payment intent success:', {
      donationId: donationDoc.id,
      campaignId: donationData.campaignId,
      amount: donationData.amount,
    })
  } catch (error) {
    console.error('❌ Error handling payment intent success:', error)
    throw error // Re-throw to be caught by main handler
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log('Payment intent failed:', paymentIntent.id)
  
  try {
    // Find the donation record
    const donationsSnapshot = await adminDb.collection('donations')
      .where('paymentIntentId', '==', paymentIntent.id)
      .get()

    if (donationsSnapshot.empty) {
      console.log('No donation record found for payment intent:', paymentIntent.id)
      return
    }

    const donationDoc = donationsSnapshot.docs[0]

    // Update donation status
    await donationDoc.ref.update({
      status: 'failed',
      timestamp: new Date().toISOString(),
    })

    console.log('Marked donation as failed:', donationDoc.id)
  } catch (error) {
    console.error('Error handling payment intent failure:', error)
  }
} 