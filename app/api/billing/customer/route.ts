import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guardianId, email, name, phone } = body

    // Validate required fields
    if (!guardianId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: guardianId, email, and name are required' },
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
        email: email,
        name: name,
        phone: phone,
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

      return NextResponse.json({
        customerId: stripeCustomerId,
        isNew: true,
        message: 'Customer created successfully'
      })
    }

    // If customer already exists, return the existing customer ID
    return NextResponse.json({
      customerId: stripeCustomerId,
      isNew: false,
      message: 'Customer already exists'
    })

  } catch (error: any) {
    console.error('Customer creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create/get customer' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guardianId = searchParams.get('guardianId')

    if (!guardianId) {
      return NextResponse.json(
        { error: 'Guardian ID is required' },
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
    const stripeCustomerId = guardianData?.stripeCustomerId

    if (!stripeCustomerId) {
      return NextResponse.json({
        exists: false,
        message: 'No Stripe customer found for this guardian'
      })
    }

    // Optionally fetch customer details from Stripe
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId)
      return NextResponse.json({
        exists: true,
        customerId: stripeCustomerId,
        customer: customer
      })
    } catch (stripeError) {
      // If Stripe customer doesn't exist, remove the reference
      await adminDb.collection('users').doc(guardianId).update({
        stripeCustomerId: null,
        updatedAt: new Date().toISOString(),
      })

      return NextResponse.json({
        exists: false,
        message: 'Stripe customer not found, reference removed'
      })
    }

  } catch (error: any) {
    console.error('Customer retrieval error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve customer' },
      { status: 500 }
    )
  }
} 