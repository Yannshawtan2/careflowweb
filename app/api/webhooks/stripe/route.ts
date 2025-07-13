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

    console.log('Received webhook event:', event.type)

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