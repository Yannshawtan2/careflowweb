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

    // Transform Stripe data to match our interface - with proper async handling
    const transformedSubscriptions = await Promise.all(subscriptions.data.map(async (sub) => {
      try {
        const customer = sub.customer as any
        const guardian = guardians.get(customer.id)
        const subscription = sub as any

        // Calculate total amount from all subscription items
        const totalAmount = sub.items.data.reduce((sum, item) => {
          const price = item.price as any
          return sum + ((price?.unit_amount || 0) / 100)
        }, 0)

        // Get description from the first item (main subscription)
        const mainPrice = sub.items.data[0]?.price as any
        const frequency = mainPrice?.recurring?.interval || 'monthly'
        const description = mainPrice?.product_data?.name || 'Subscription'

        // Calculate next payment date more accurately based on subscription status
        let nextPaymentDate: string
        
        if (subscription.cancel_at_period_end && subscription.current_period_end) {
          // Subscription is scheduled to cancel at period end - show when it ends
          const endDate = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
          nextPaymentDate = `Ends ${endDate}`
        } else if (subscription.cancel_at_period_end) {
          // Subscription is scheduled to cancel but no end date available
          nextPaymentDate = 'Ending Soon'
        } else if (sub.status === 'active') {
          // For active subscriptions, get the next payment date from subscription items
          // Some subscriptions don't have current_period_end at the top level
          if (subscription.current_period_end) {
            const nextPaymentDateTime = new Date(subscription.current_period_end * 1000)
            nextPaymentDate = nextPaymentDateTime.toISOString().split('T')[0]
          } else if (subscription.items?.data?.[0]?.current_period_end) {
            // Fallback to first subscription item's period end
            const nextPaymentDateTime = new Date(subscription.items.data[0].current_period_end * 1000)
            nextPaymentDate = nextPaymentDateTime.toISOString().split('T')[0]
          } else {
            // Final fallback - use billing cycle anchor + 1 month
            const billingAnchor = subscription.billing_cycle_anchor || subscription.created
            const nextPaymentDateTime = new Date(billingAnchor * 1000)
            nextPaymentDateTime.setMonth(nextPaymentDateTime.getMonth() + 1)
            nextPaymentDate = nextPaymentDateTime.toISOString().split('T')[0]
          }
        } else if (sub.status === 'canceled') {
          // For canceled subscriptions, no next payment
          nextPaymentDate = 'Canceled'
        } else if (sub.status === 'paused' || sub.status === 'incomplete') {
          // For paused or incomplete subscriptions, no next payment
          nextPaymentDate = 'N/A'
        } else {
          // Fallback for other statuses
          nextPaymentDate = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
            : 'N/A'
        }
        
        const createdAt = subscription.created 
          ? new Date(subscription.created * 1000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

        return {
          id: sub.id,
          guardianId: guardian?.id || customer.id,
          guardianName: guardian?.name || customer.name || customer.email,
          amount: totalAmount, // Now shows total of all items
          frequency: frequency,
          status: sub.status,
          nextPaymentDate,
          description,
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
    }))

    return NextResponse.json(transformedSubscriptions)
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
} 