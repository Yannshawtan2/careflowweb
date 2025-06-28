import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    
    // Current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Previous month
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    
    // Current week
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay())
    const currentWeekEnd = new Date(now)
    
    // Previous week
    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(currentWeekStart.getDate() - 7)
    const previousWeekEnd = new Date(currentWeekStart)
    previousWeekEnd.setDate(currentWeekStart.getDate() - 1)

    // Get current month revenue
    const currentMonthPayments = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        gte: Math.floor(currentMonthStart.getTime() / 1000),
        lte: Math.floor(currentMonthEnd.getTime() / 1000),
      },
    })
    const currentMonthRevenue = currentMonthPayments.data
      .filter(pi => pi.status === 'succeeded')
      .reduce((sum, pi) => sum + pi.amount, 0) / 100

    // Get previous month revenue
    const previousMonthPayments = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        gte: Math.floor(previousMonthStart.getTime() / 1000),
        lte: Math.floor(previousMonthEnd.getTime() / 1000),
      },
    })
    const previousMonthRevenue = previousMonthPayments.data
      .filter(pi => pi.status === 'succeeded')
      .reduce((sum, pi) => sum + pi.amount, 0) / 100

    // Get current week subscriptions
    const currentWeekSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      created: {
        gte: Math.floor(currentWeekStart.getTime() / 1000),
        lte: Math.floor(currentWeekEnd.getTime() / 1000),
      },
    })

    // Get previous week subscriptions
    const previousWeekSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      created: {
        gte: Math.floor(previousWeekStart.getTime() / 1000),
        lte: Math.floor(previousWeekEnd.getTime() / 1000),
      },
    })

    // Calculate growth percentages
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0
    
    const subscriptionGrowth = previousWeekSubscriptions.data.length > 0
      ? currentWeekSubscriptions.data.length - previousWeekSubscriptions.data.length
      : currentWeekSubscriptions.data.length

    return NextResponse.json({
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      subscriptionGrowth,
      currentMonthRevenue: Math.round(currentMonthRevenue * 100) / 100,
      previousMonthRevenue: Math.round(previousMonthRevenue * 100) / 100,
    })
  } catch (error: any) {
    console.error('Error calculating growth metrics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate growth metrics' },
      { status: 500 }
    )
  }
} 