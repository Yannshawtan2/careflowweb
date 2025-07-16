import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('Received webhook event:', event.type, 'ID:', event.id)

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

async function handleCheckoutSessionCompleted(session: any) {
  console.log('Checkout session completed:', session.id)
  console.log('Session data:', JSON.stringify(session, null, 2))
  
  try {
    // Find the donation record by session ID
    const donationsSnapshot = await adminDb.collection('donations')
      .where('sessionId', '==', session.id)
      .get()

    if (donationsSnapshot.empty) {
      console.log('No donation record found for session:', session.id)
      return
    }

    const donationDoc = donationsSnapshot.docs[0]
    const donationData = donationDoc.data()
    console.log('Found donation record:', donationData)

    // Update donation status
    await donationDoc.ref.update({
      status: 'succeeded',
      timestamp: new Date().toISOString(),
    })

    // Update campaign totals
    const campaignRef = adminDb.collection('campaigns').doc(donationData.campaignId)
    
    // Use transaction to ensure atomic updates
    await adminDb.runTransaction(async (transaction) => {
      const campaignDoc = await transaction.get(campaignRef)
      if (!campaignDoc.exists) {
        throw new Error('Campaign not found')
      }

      const campaignData = campaignDoc.data()
      const newTotalRaised = (campaignData?.totalRaised || 0) + donationData.amount
      const newDonationCount = (campaignData?.donationCount || 0) + 1

      console.log('Updating campaign totals:', {
        currentTotal: campaignData?.totalRaised || 0,
        newAmount: donationData.amount,
        newTotal: newTotalRaised,
        currentCount: campaignData?.donationCount || 0,
        newCount: newDonationCount
      })

      transaction.update(campaignRef, {
        totalRaised: newTotalRaised,
        donationCount: newDonationCount,
      })
    })

    console.log('Successfully updated donation and campaign totals:', {
      donationId: donationDoc.id,
      campaignId: donationData.campaignId,
      amount: donationData.amount,
    })
  } catch (error) {
    console.error('Error handling checkout session completion:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log('Payment intent succeeded:', paymentIntent.id)
  console.log('Payment intent data:', JSON.stringify(paymentIntent, null, 2))
  
  try {
    // First try to find by payment intent ID
    let donationsSnapshot = await adminDb.collection('donations')
      .where('paymentIntentId', '==', paymentIntent.id)
      .get()

    // If not found, try to find by session ID (for checkout sessions)
    if (donationsSnapshot.empty && paymentIntent.metadata?.session_id) {
      console.log('Trying to find donation by session ID:', paymentIntent.metadata.session_id)
      donationsSnapshot = await adminDb.collection('donations')
        .where('sessionId', '==', paymentIntent.metadata.session_id)
        .get()
    }

    if (donationsSnapshot.empty) {
      console.log('No donation record found for payment intent:', paymentIntent.id)
      return
    }

    const donationDoc = donationsSnapshot.docs[0]
    const donationData = donationDoc.data()
    console.log('Found donation record:', donationData)

    // Check if already processed
    if (donationData.status === 'succeeded') {
      console.log('Donation already processed, skipping')
      return
    }

    // Update donation status
    await donationDoc.ref.update({
      status: 'succeeded',
      timestamp: new Date().toISOString(),
    })

    // Update campaign totals
    const campaignRef = adminDb.collection('campaigns').doc(donationData.campaignId)
    
    // Use transaction to ensure atomic updates
    await adminDb.runTransaction(async (transaction) => {
      const campaignDoc = await transaction.get(campaignRef)
      if (!campaignDoc.exists) {
        throw new Error('Campaign not found')
      }

      const campaignData = campaignDoc.data()
      const newTotalRaised = (campaignData?.totalRaised || 0) + donationData.amount
      const newDonationCount = (campaignData?.donationCount || 0) + 1

      console.log('Updating campaign totals:', {
        currentTotal: campaignData?.totalRaised || 0,
        newAmount: donationData.amount,
        newTotal: newTotalRaised,
        currentCount: campaignData?.donationCount || 0,
        newCount: newDonationCount
      })

      transaction.update(campaignRef, {
        totalRaised: newTotalRaised,
        donationCount: newDonationCount,
      })
    })

    console.log('Successfully updated donation and campaign totals:', {
      donationId: donationDoc.id,
      campaignId: donationData.campaignId,
      amount: donationData.amount,
    })
  } catch (error) {
    console.error('Error handling payment intent success:', error)
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