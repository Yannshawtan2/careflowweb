import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    // Get all subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ['data.customer', 'data.items.data.price'],
    })

    // Get all customers to map guardian information
    const customers = await stripe.customers.list({
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
          phone: data.phone,
        })
      }
    })

    // Transform Stripe data to match our interface
    const transformedSubscriptions = subscriptions.data.map(sub => {
      try {
        const customer = sub.customer as any
        const guardian = guardians.get(customer.id)
        const price = sub.items.data[0]?.price as any
        const subscription = sub as any

        // Safely handle dates with fallbacks
        const nextPaymentDate = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
        
        const createdAt = subscription.created 
          ? new Date(subscription.created * 1000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

        return {
          id: sub.id,
          guardianId: guardian?.id || customer.id,
          guardianName: guardian?.name || customer.name || customer.email,
          amount: (price?.unit_amount || 0) / 100, // Convert from cents
          frequency: price?.recurring?.interval || 'monthly',
          status: sub.status,
          nextPaymentDate,
          description: price?.product_data?.name || 'Subscription',
          createdAt,
          stripeCustomerId: customer.id,
          cancelAt: subscription.cancel_at 
            ? new Date(subscription.cancel_at * 1000).toISOString().split('T')[0]
            : undefined,
        }
      } catch (error) {
        console.error('Error transforming subscription:', sub.id, error)
        // Return a fallback subscription object
        return {
          id: sub.id,
          guardianId: 'unknown',
          guardianName: 'Unknown Customer',
          amount: 0,
          frequency: 'monthly',
          status: sub.status,
          nextPaymentDate: new Date().toISOString().split('T')[0],
          description: 'Subscription',
          createdAt: new Date().toISOString().split('T')[0],
          stripeCustomerId: 'unknown',
          cancelAt: undefined,
        }
      }
    })

    return NextResponse.json(transformedSubscriptions)
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
} 