import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { assessmentType, assessmentData } = body;

    if (!assessmentType || !assessmentData) {
      console.error('Missing assessmentType or assessmentData', { body });
      return NextResponse.json({ success: false, error: 'Missing assessmentType or assessmentData' }, { status: 400 });
    }

    const docRef = adminDb.collection('clinicalNotes').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      console.error('Clinical note not found', { id });
      return NextResponse.json({ success: false, error: 'Clinical note not found' }, { status: 404 });
    }

    await docRef.update({
      assessmentType,
      assessmentData,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/clinical-notes/[id] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await adminDb.collection('clinicalNotes').doc(id).delete()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
} 