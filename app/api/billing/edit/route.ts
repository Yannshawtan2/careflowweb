import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, amount, frequency, description, lineItems } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Get the current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    })
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // If amount, frequency, or lineItems are being changed, we need to recreate the subscription items
    if (amount !== undefined || frequency || lineItems) {
      // Convert frequency to Stripe interval
      const intervalMap: Record<string, string> = {
        monthly: 'month',
        quarterly: 'month',
        yearly: 'year'
      }

      const currentPrice = subscription.items.data[0].price as any
      const currentFrequency = currentPrice.recurring.interval
      const currentIntervalCount = currentPrice.recurring.interval_count || 1
      
      // Map current Stripe interval back to our frequency format
      let currentFrequencyFormat = 'monthly'
      if (currentFrequency === 'year') {
        currentFrequencyFormat = 'yearly'
      } else if (currentFrequency === 'month' && currentIntervalCount === 3) {
        currentFrequencyFormat = 'quarterly'
      } else if (currentFrequency === 'month' && currentIntervalCount === 1) {
        currentFrequencyFormat = 'monthly'
      }
      
      const newFrequency = frequency || currentFrequencyFormat
      const newAmount = amount !== undefined ? amount : (currentPrice.unit_amount / 100)
      
      // Check if frequency is actually changing
      const isFrequencyChanging = frequency && frequency !== currentFrequencyFormat

      // Create new price for the main subscription
      const mainPrice = await stripe.prices.create({
        unit_amount: Math.round(newAmount * 100),
        currency: currentPrice.currency,
        recurring: {
          interval: intervalMap[newFrequency] === 'month' ? 'month' : 'year',
          interval_count: newFrequency === 'quarterly' ? 3 : 1,
        },
        product_data: {
          name: description || currentPrice.product_data?.name || 'Subscription',
        },
      })

      // Create new subscription items array
      const newItems = [{ price: mainPrice.id }]

      // Add line items if they exist
      if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
        for (const lineItem of lineItems) {
          if (lineItem.item && lineItem.price > 0) {
            const lineItemPrice = await stripe.prices.create({
              unit_amount: Math.round(lineItem.price * 100),
              currency: currentPrice.currency,
              recurring: {
                interval: intervalMap[newFrequency] === 'month' ? 'month' : 'year',
                interval_count: newFrequency === 'quarterly' ? 3 : 1,
              },
              product_data: {
                name: lineItem.item,
              },
            })
            newItems.push({ price: lineItemPrice.id })
          }
        }
      }

      // Replace all subscription items with new ones
      const itemsToUpdate = subscription.items.data.map((item, index) => {
        if (index === 0) {
          return { id: item.id, price: newItems[0].price }
        } else {
          return { id: item.id, deleted: true }
        }
      })

      // Add new line items
      const itemsToAdd = newItems.slice(1).map(item => ({ price: item.price }))

      // Update the subscription - handle frequency changes differently
      if (isFrequencyChanging) {
        // If frequency is changing, we need to allow billing cycle change
        await stripe.subscriptions.update(subscriptionId, {
          items: [...itemsToUpdate, ...itemsToAdd],
          proration_behavior: 'none', // Don't charge immediately
          billing_cycle_anchor: 'now', // Start new billing cycle to allow frequency change
        })
      } else {
        // If only amount or line items are changing, keep billing cycle unchanged
        await stripe.subscriptions.update(subscriptionId, {
          items: [...itemsToUpdate, ...itemsToAdd],
          proration_behavior: 'none', // Don't charge immediately
          billing_cycle_anchor: 'unchanged', // Keep the same billing cycle
        })
      }
    }

    // If only description changed, update the product
    if (description && amount === undefined && !frequency && (!lineItems || lineItems.length === 0)) {
      const currentPrice = subscription.items.data[0].price as any
      
      if (currentPrice.product) {
        await stripe.products.update(currentPrice.product, {
          name: description,
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription updated successfully. Changes will take effect on the next billing cycle.'
    })
  } catch (error: any) {
    console.error('Error editing subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to edit subscription' },
      { status: 500 }
    )
  }
} 