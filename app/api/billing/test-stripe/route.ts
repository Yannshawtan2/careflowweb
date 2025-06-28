import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    // Test basic Stripe connectivity
    const testCustomer = await stripe.customers.list({ limit: 1 })
    const testSubscriptions = await stripe.subscriptions.list({ limit: 1 })
    const testPaymentIntents = await stripe.paymentIntents.list({ limit: 1 })

    return NextResponse.json({
      success: true,
      stripeConnected: true,
      customersCount: testCustomer.data.length,
      subscriptionsCount: testSubscriptions.data.length,
      paymentIntentsCount: testPaymentIntents.data.length,
      testData: {
        customers: testCustomer.data,
        subscriptions: testSubscriptions.data,
        paymentIntents: testPaymentIntents.data,
      }
    })
  } catch (error: any) {
    console.error('Stripe test error:', error)
    return NextResponse.json({
      success: false,
      stripeConnected: false,
      error: error.message
    }, { status: 500 })
  }
} 