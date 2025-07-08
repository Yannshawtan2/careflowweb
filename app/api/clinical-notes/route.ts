import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    // Query clinical notes for the specific patient, ordered by timestamp descending
    const snapshot = await adminDb
      .collection('clinicalNotes')
      .where('patientId', '==', patientId)
      .orderBy('timestamp', 'desc')
      .get()

    const clinicalNotes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({
      success: true,
      clinicalNotes,
      count: clinicalNotes.length
    })

  } catch (error) {
    console.error('Error fetching clinical notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clinical notes' },
      { status: 500 }
    )
  }
} 