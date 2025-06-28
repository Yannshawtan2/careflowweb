import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6')

    // Get current date
    const now = new Date()
    const revenueData = []

    // Fetch revenue data for the last N months
    for (let i = months - 1; i >= 0; i--) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      // Get payment intents for this month
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 100,
        created: {
          gte: Math.floor(startOfMonth.getTime() / 1000),
          lte: Math.floor(endOfMonth.getTime() / 1000),
        },
      })

      // Calculate total revenue for this month
      const monthlyRevenue = paymentIntents.data
        .filter(pi => pi.status === 'succeeded')
        .reduce((sum, pi) => sum + pi.amount, 0) / 100

      revenueData.push({
        month: startOfMonth.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.round(monthlyRevenue * 100) / 100,
        year: startOfMonth.getFullYear(),
      })
    }

    return NextResponse.json(revenueData)
  } catch (error: any) {
    console.error('Error fetching revenue history:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch revenue history' },
      { status: 500 }
    )
  }
} 