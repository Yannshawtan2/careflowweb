import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    
    if (!decodedClaims) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get user data from database
    const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    return NextResponse.json({
      id: userDoc.id,
      email: userData?.email || decodedClaims.email,
      name: userData?.name,
      role: userData?.role || 'user',
      phone: userData?.phone,
      stripeCustomerId: userData?.stripeCustomerId,
    })
  } catch (error: any) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 