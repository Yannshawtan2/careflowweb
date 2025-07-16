import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Optionally validate body here
    const docRef = await adminDb.collection('inventory').add({
      ...body,
      createdAt: new Date().toISOString(),
    })
    // Set the document's id field to the Firestore document ID
    await adminDb.collection('inventory').doc(docRef.id).update({ id: docRef.id })
    return NextResponse.json({ success: true, id: docRef.id })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function GET() {
  try {
    const snapshot = await adminDb.collection('inventory').get()
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json({ success: true, items })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url!)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })
    }
    const body = await req.json()
    await adminDb.collection('inventory').doc(id).update({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url!)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })
    }
    await adminDb.collection('inventory').doc(id).delete()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
} 