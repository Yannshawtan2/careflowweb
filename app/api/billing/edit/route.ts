import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, amount, frequency, description } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Get the current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // If amount or frequency is being changed, we need to create a new price
    if (amount || frequency) {
      const currentItem = subscription.items.data[0]
      const currentPrice = currentItem.price as any

      // Create new price if amount or frequency changed
      const newPrice = await stripe.prices.create({
        unit_amount: amount ? Math.round(amount * 100) : currentPrice.unit_amount,
        currency: currentPrice.currency,
        recurring: {
          interval: frequency === 'quarterly' ? 'month' : (frequency || currentPrice.recurring.interval),
          interval_count: frequency === 'quarterly' ? 3 : 1,
        },
        product_data: {
          name: description || currentPrice.product_data?.name || 'Subscription',
        },
      })

      // Update the subscription with the new price
      await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: currentItem.id,
          price: newPrice.id,
        }],
        proration_behavior: 'create_prorations',
      })
    }

    // If only description changed, update the product
    if (description && !amount && !frequency) {
      const currentItem = subscription.items.data[0]
      const currentPrice = currentItem.price as any
      
      if (currentPrice.product) {
        await stripe.products.update(currentPrice.product, {
          name: description,
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription updated successfully'
    })
  } catch (error: any) {
    console.error('Error editing subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to edit subscription' },
      { status: 500 }
    )
  }
} 