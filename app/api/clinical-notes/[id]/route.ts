import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { assessmentType, assessmentData } = body

    if (!assessmentType || !assessmentData) {
      return NextResponse.json(
        { error: 'Assessment type and data are required' },
        { status: 400 }
      )
    }

    const noteRef = adminDb.collection('clinicalNotes').doc(id)
    
    // Check if the note exists
    const noteSnap = await noteRef.get()
    if (!noteSnap.exists) {
      return NextResponse.json(
        { error: 'Clinical note not found' },
        { status: 404 }
      )
    }

    // Update the clinical note
    await noteRef.update({
      assessmentType,
      assessmentData,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Clinical note updated successfully'
    })

  } catch (error) {
    console.error('Error updating clinical note:', error)
    return NextResponse.json(
      { error: 'Failed to update clinical note' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const noteRef = adminDb.collection('clinicalNotes').doc(id)
    
    // Check if the note exists
    const noteSnap = await noteRef.get()
    if (!noteSnap.exists) {
      return NextResponse.json(
        { error: 'Clinical note not found' },
        { status: 404 }
      )
    }

    // Delete the clinical note
    await noteRef.delete()

    return NextResponse.json({
      success: true,
      message: 'Clinical note deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting clinical note:', error)
    return NextResponse.json(
      { error: 'Failed to delete clinical note' },
      { status: 500 }
    )
  }
} 