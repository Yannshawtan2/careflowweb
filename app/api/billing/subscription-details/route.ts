import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')

    console.log('Fetching subscription details for ID:', subscriptionId)

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Get subscription details with expanded items and prices
    console.log('Calling Stripe API...')
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product']
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    console.log('Subscription retrieved:', subscription.id, 'with', subscription.items.data.length, 'items')

    // Parse the subscription items to separate base amount and line items
    const items = subscription.items.data.map(item => {
      const price = item.price as any
      const product = price.product as any
      
      return {
        id: item.id,
        name: product?.name || 'Unknown Item',
        amount: (price.unit_amount || 0) / 100,
        frequency: price.recurring?.interval || 'monthly',
        intervalCount: price.recurring?.interval_count || 1,
      }
    })

    // Assume the first item is the base subscription
    const baseItem = items[0]
    const lineItems = items.slice(1).map(item => ({
      item: item.name,
      price: item.amount,
    }))

    // Map Stripe frequency to our format
    let frequency = 'monthly'
    if (baseItem) {
      if (baseItem.frequency === 'year') {
        frequency = 'yearly'
      } else if (baseItem.frequency === 'month' && baseItem.intervalCount === 3) {
        frequency = 'quarterly'
      } else if (baseItem.frequency === 'month' && baseItem.intervalCount === 1) {
        frequency = 'monthly'
      }
    }

    const result = {
      subscriptionId: subscription.id,
      baseAmount: baseItem?.amount || 0,
      frequency: frequency,
      description: baseItem?.name || 'Subscription',
      lineItems: lineItems,
      status: subscription.status,
      nextPaymentDate: (subscription as any).current_period_end 
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null,
    }

    console.log('Returning result:', result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching subscription details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription details' },
      { status: 500 }
    )
  }
}
