import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Get the subscription to check if it exists
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    let updatedSubscription
    if (subscription.status === 'incomplete') {
      // Cancel immediately
      updatedSubscription = await stripe.subscriptions.cancel(subscriptionId)
    } else {
      // Schedule cancellation at period end
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
    }

    return NextResponse.json({ 
      success: true,
      message: updatedSubscription.status === 'canceled'
        ? 'Subscription cancelled immediately.'
        : 'Subscription will be cancelled at the end of the current billing period',
      cancelAt: updatedSubscription.cancel_at 
        ? new Date(updatedSubscription.cancel_at * 1000).toISOString().split('T')[0]
        : null
    })
  } catch (error: any) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete subscription' },
      { status: 500 }
    )
  }
} 