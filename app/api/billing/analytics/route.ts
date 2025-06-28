import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    // Get current month's start and end dates
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'active',
    })

    // Get payment intents for current month
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        gte: Math.floor(startOfMonth.getTime() / 1000),
        lte: Math.floor(endOfMonth.getTime() / 1000),
      },
    })

    // Calculate metrics
    const activeSubscriptions = subscriptions.data.length
    const monthlyRevenue = paymentIntents.data
      .filter(pi => pi.status === 'succeeded')
      .reduce((sum, pi) => sum + pi.amount, 0) / 100

    const failedPayments = paymentIntents.data.filter(pi => pi.status === 'canceled').length
    const totalPayments = paymentIntents.data.length
    const paymentSuccessRate = totalPayments > 0 ? ((totalPayments - failedPayments) / totalPayments) * 100 : 0

    // Calculate upcoming renewals (next 7 days)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const upcomingRenewals = subscriptions.data.filter(sub => {
      const nextPayment = new Date((sub as any).current_period_end * 1000)
      return nextPayment >= now && nextPayment <= sevenDaysFromNow
    }).length

    // Get plan distribution
    const planDistribution = subscriptions.data.reduce((acc, sub) => {
      const interval = (sub.items.data[0]?.price as any)?.recurring?.interval || 'monthly'
      acc[interval] = (acc[interval] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate customer lifetime value (average subscription amount)
    const totalSubscriptionValue = subscriptions.data.reduce((sum, sub) => {
      return sum + ((sub.items.data[0]?.price as any)?.unit_amount || 0) / 100
    }, 0)
    const customerLifetimeValue = activeSubscriptions > 0 ? totalSubscriptionValue / activeSubscriptions : 0

    const metrics = {
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      activeSubscriptions,
      failedPayments,
      paymentSuccessRate: Math.round(paymentSuccessRate * 10) / 10,
      upcomingRenewals,
      customerLifetimeValue: Math.round(customerLifetimeValue * 100) / 100,
    }

    return NextResponse.json({
      metrics,
      planDistribution,
      totalSubscriptions: subscriptions.data.length,
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
} 