// app/api/notify-guardian/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { guardianId, patientName, patientId } = await req.json();

    console.log('Guardian ID:', guardianId);
    console.log('Patient Name:', patientName);
    console.log('Patient ID:', patientId);

    // Get guardian's FCM token from Firestore
    // guardianId is actually the guardian's uid in the users collection
    const guardianDoc = await adminDb.collection('users').doc(guardianId).get();
    
    if (!guardianDoc.exists) {
      console.log('Guardian document does not exist');
      return NextResponse.json({ error: 'Guardian not found' }, { status: 404 });
    }

    const fcmToken = guardianDoc.get('fcmToken');
    console.log('FCM token found:', !!fcmToken);
    
    if (!fcmToken) {
      return NextResponse.json({ error: 'No FCM token for guardian' }, { status: 400 });
    }

    // Send FCM notification
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Emergency Alert',
        body: `Emergency for patient ${patientName}`,
      },
      data: {
        type: 'emergency',
        patientId: patientId,
        patientName: patientName,
      },
    });

    console.log('Emergency notification sent successfully');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error sending emergency notification:', err);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}