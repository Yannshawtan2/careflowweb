import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, patientName, guardianName, guardianPhone, contactMethod, urgency, message } = body

    if (!patientId || !patientName || !guardianName || !guardianPhone || !contactMethod || !urgency || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log the emergency contact attempt
    const emergencyContactLog = {
      patientId,
      patientName,
      guardianName,
      guardianPhone,
      contactMethod,
      urgency,
      message,
      timestamp: serverTimestamp(),
      status: 'sent'
    }

    await addDoc(collection(db, 'emergencyContacts'), emergencyContactLog)

    // Here you would integrate with actual SMS/email services
    // For now, we'll simulate the contact
    console.log('Emergency Contact Details:', emergencyContactLog)

    return NextResponse.json({
      success: true,
      message: `Emergency contact sent via ${contactMethod}`,
      contactInfo: guardianPhone
    })

  } catch (error) {
    console.error('Error sending emergency contact:', error)
    return NextResponse.json(
      { error: 'Failed to send emergency contact' },
      { status: 500 }
    )
  }
} 