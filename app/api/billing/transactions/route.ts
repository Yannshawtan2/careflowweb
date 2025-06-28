import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    // Get all payment intents from Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    })

    // Get all charges for additional transaction data
    const charges = await stripe.charges.list({
      limit: 100,
    })

    // Get guardian data from Firestore
    const guardiansSnapshot = await adminDb.collection('users').get()
    const guardians = new Map()
    guardiansSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.stripeCustomerId) {
        guardians.set(data.stripeCustomerId, {
          id: doc.id,
          name: data.name,
          email: data.email,
        })
      }
    })

    // Transform payment intents to transactions
    const transformedTransactions = paymentIntents.data.map(paymentIntent => {
      const guardian = guardians.get(paymentIntent.customer as string)
      const charge = charges.data.find(c => c.payment_intent === paymentIntent.id)

      return {
        id: paymentIntent.id,
        subscriptionId: paymentIntent.metadata?.subscriptionId || null,
        guardianName: guardian?.name || 'Unknown Customer',
        amount: paymentIntent.amount / 100, // Convert from cents
        status: paymentIntent.status === 'succeeded' ? 'completed' : 
                paymentIntent.status === 'processing' ? 'pending' : 'failed',
        date: new Date(paymentIntent.created * 1000).toISOString().split('T')[0],
        paymentMethod: charge?.payment_method_details?.card ? 
          `${charge.payment_method_details.card.brand} ****${charge.payment_method_details.card.last4}` : 
          'Unknown',
        failureReason: paymentIntent.last_payment_error?.message || null,
      }
    })

    // Sort by date (newest first)
    transformedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json(transformedTransactions)
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
} 