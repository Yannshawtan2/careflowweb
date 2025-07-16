import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import type { Donation } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Get all donations and filter in memory to avoid any index requirements
    const snapshot = await adminDb.collection('donations').get()
    
    // Filter and sort in memory
    let donations = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Donation))
      .filter(donation => donation.status === 'succeeded')
    
    // Filter by campaign if specified
    if (campaignId) {
      donations = donations.filter(donation => donation.campaignId === campaignId)
    }
    
    // Sort by timestamp (newest first) and limit
    donations = donations
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
    
    return NextResponse.json({
      success: true,
      donations,
      count: donations.length
    })
  } catch (error: any) {
    console.error('Error fetching donation history:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
} 