import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('donationCampaigns')
      .where('active', '==', true)
      .orderBy('createdAt', 'desc')
      .get()
    const campaigns = snapshot.docs.map(doc => {
      const data = doc.data();
      if ('id' in data) delete data.id;
      return { id: doc.id, ...data };
    })
    return NextResponse.json({ campaigns })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 