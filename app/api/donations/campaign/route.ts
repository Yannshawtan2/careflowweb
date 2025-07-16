import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('API: Received donation campaign creation request')
    
    const body = await request.json()
    console.log('API: Request body:', body)
    
    const { title, description, goalAmount, imageUrl } = body
    
    // Validate required fields
    if (!title || !description || !goalAmount) {
      console.error('API: Missing required fields', { title: !!title, description: !!description, goalAmount: !!goalAmount })
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: {
          title: !title ? 'Title is required' : null,
          description: !description ? 'Description is required' : null,
          goalAmount: !goalAmount ? 'Goal amount is required' : null
        }
      }, { status: 400 })
    }
    
    // Validate goal is a positive number
    const goalNumber = Number(goalAmount)
    if (isNaN(goalNumber) || goalNumber <= 0) {
      console.error('API: Invalid goal amount:', goalAmount)
      return NextResponse.json({ 
        error: 'Goal amount must be a positive number',
        received: goalAmount
      }, { status: 400 })
    }
    
    const now = new Date().toISOString()
    
    const campaignData = {
      title: title.trim(),
      description: description.trim(),
      goalAmount: goalNumber,
      totalRaised: 0, // Initialize raised amount
      donationCount: 0, // Initialize donor count
      imageUrl: imageUrl || '', // Ensure it's a string, not undefined
      createdAt: now,
      active: true,
    }
    
    console.log('API: Creating campaign with data:', campaignData)
    
    // Create the document
    const docRef = await adminDb.collection('campaigns').add(campaignData)
    console.log('API: Document created with ID:', docRef.id)
    
    // Update the document with its own ID
    await docRef.update({ id: docRef.id })
    console.log('API: Document updated with ID field')
    
    // Get the updated document
    const doc = await docRef.get()
    const finalData = { id: doc.id, ...doc.data() }
    
    console.log('API: Final campaign data:', finalData)
    
    return NextResponse.json({
      success: true,
      campaign: finalData
    })
    
  } catch (error: any) {
    console.error('API: Error creating campaign:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.stack
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')
    const id = searchParams.get('id')
    
    if (id) {
      // Get specific campaign
      const doc = await adminDb.collection('campaigns').doc(id).get()
      if (!doc.exists) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }
      const data = doc.data()
      return NextResponse.json({ 
        campaign: { id: doc.id, ...data }
      })
    }
    
    // Get all campaigns
    let query: FirebaseFirestore.Query = adminDb.collection('campaigns')
    if (!all) {
      query = query.where('active', '==', true)
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get()
    const campaigns = snapshot.docs.map(doc => {
      const data = doc.data();
      if ('id' in data) delete data.id;
      if (!data.createdAt) data.createdAt = doc.createTime?.toDate().toISOString() || "";
      return { id: doc.id, ...data };
    })
    return NextResponse.json({ campaigns })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { title, description, goalAmount, imageUrl } = await request.json()
    await adminDb.collection('campaigns').doc(id).update({
      title,
      description,
      goalAmount,
      imageUrl: imageUrl || '',
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await adminDb.collection('campaigns').doc(id).delete()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}