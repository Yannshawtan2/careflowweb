import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { title, description, goal, imageUrl } = await request.json()
    if (!title || !description || !goal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const now = new Date().toISOString()
    const docRef = await adminDb.collection('donationCampaigns').add({
      title,
      description,
      goal,
      imageUrl: imageUrl || '',
      createdAt: now,
      active: true,
    })
    await docRef.update({ id: docRef.id })
    const doc = await docRef.get()
    return NextResponse.json({
      success: true,
      campaign: { id: doc.id, ...doc.data() }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 