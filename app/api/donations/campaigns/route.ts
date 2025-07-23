import { NextRequest, NextResponse } from "next/server"
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
    try {
      console.log('API: Testing donation campaigns endpoint')
      
      const snapshot = await adminDb.collection('campaigns').get()
      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return NextResponse.json({
        success: true,
        campaigns,
        count: campaigns.length
      })
      
    } catch (error: any) {
      console.error('API: Error fetching campaigns:', error)
      return NextResponse.json({ 
        error: error.message || 'Internal server error'
      }, { status: 500 })
    }
  }