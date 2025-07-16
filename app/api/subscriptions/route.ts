// app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guardianId, amount, frequency, description, startDate, lineItems } = body

    // Validate required fields
    if (!guardianId || !amount || !frequency || !description || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get guardian details from Firestore
    const guardianDoc = await adminDb.collection('users').doc(guardianId).get()
    if (!guardianDoc.exists) {
      return NextResponse.json(
        { error: 'Guardian not found' },
        { status: 404 }
      )
    }

    const guardianData = guardianDoc.data()
    let stripeCustomerId = guardianData?.stripeCustomerId

    // If guardian doesn't have a Stripe customer ID, create one
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: guardianData?.email,
        name: guardianData?.name,
        phone: guardianData?.phone,
        metadata: {
          guardianId: guardianId,
          firebaseUid: guardianId,
        },
      })

      stripeCustomerId = customer.id

      // Update the guardian record with the Stripe customer ID
      await adminDb.collection('users').doc(guardianId).update({
        stripeCustomerId: stripeCustomerId,
        updatedAt: new Date().toISOString(),
      })
    }

    // Convert frequency to Stripe interval
    const intervalMap: Record<string, string> = {
      monthly: 'month',
      quarterly: 'month', // We'll use interval_count: 3 for quarterly
      yearly: 'year'
    }

    // Create a price object for the main subscription
    const mainPrice = await stripe.prices.create({
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: 'myr',
      recurring: {
        interval: intervalMap[frequency] as 'month' | 'year',
        interval_count: frequency === 'quarterly' ? 3 : 1,
      },
      product_data: {
        name: description,
      },
    })

    // Create subscription items array starting with the main item
    const subscriptionItems = [{ price: mainPrice.id }]

    // Add line items if they exist
    if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
      for (const lineItem of lineItems) {
        if (lineItem.item && lineItem.price > 0) {
          const lineItemPrice = await stripe.prices.create({
            unit_amount: Math.round(lineItem.price * 100), // Convert to cents
            currency: 'myr',
            recurring: {
              interval: intervalMap[frequency] as 'month' | 'year',
              interval_count: frequency === 'quarterly' ? 3 : 1,
            },
            product_data: {
              name: lineItem.item,
            },
          })
          subscriptionItems.push({ price: lineItemPrice.id })
        }
      }
    }

    // Create a subscription using the existing or newly created customer
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: subscriptionItems,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    // Safely extract the payment intent
    const invoice = subscription.latest_invoice as Stripe.Invoice & {
      payment_intent: Stripe.PaymentIntent;
    }
    if (!invoice) {
      throw new Error('Failed to create invoice for subscription')
    }

    const paymentIntent = invoice.payment_intent
    
    // Return subscription details - no fallback payment intent needed
    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret || null,
      customerId: stripeCustomerId,
      status: subscription.status,
      requiresPaymentMethod: !paymentIntent?.client_secret
    })
  } catch (error: any) {
    console.error('Subscription creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}