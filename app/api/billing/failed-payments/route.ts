import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    // Get failed payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    })

    // Get charges for additional failure details
    const charges = await stripe.charges.list({
      limit: 100,
    })

    // Analyze failed payments
    const failureReasons: Record<string, number> = {}
    
    paymentIntents.data.forEach(paymentIntent => {
      if (paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method') {
        const charge = charges.data.find(c => c.payment_intent === paymentIntent.id)
        let reason = 'Unknown'
        
        if (paymentIntent.last_payment_error) {
          reason = paymentIntent.last_payment_error.message || 'Payment Error'
        } else if (charge?.failure_code) {
          switch (charge.failure_code) {
            case 'insufficient_funds':
              reason = 'Insufficient Funds'
              break
            case 'card_declined':
              reason = 'Card Declined'
              break
            case 'expired_card':
              reason = 'Expired Card'
              break
            case 'incorrect_cvc':
              reason = 'Incorrect CVC'
              break
            default:
              reason = charge.failure_message || 'Card Error'
          }
        }
        
        failureReasons[reason] = (failureReasons[reason] || 0) + 1
      }
    })

    // Convert to array format for charts
    const failedPaymentsData = Object.entries(failureReasons).map(([reason, count]) => ({
      reason,
      count,
    }))

    return NextResponse.json(failedPaymentsData)
  } catch (error: any) {
    console.error('Error fetching failed payments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch failed payments' },
      { status: 500 }
    )
  }
} 