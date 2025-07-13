// app/api/notify-guardian/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function GET() {
  try {
    console.log('=== DEBUG: Checking all guardians and FCM tokens ===');
    
    // Get all guardians
    const guardiansSnapshot = await adminDb.collection('users')
      .where('role', '==', 'guardian')
      .get();
    
    const guardians = guardiansSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name,
        email: data.email,
        hasFcmToken: !!data.fcmToken,
        fcmTokenPreview: data.fcmToken ? data.fcmToken.substring(0, 20) + '...' : 'None',
        lastTokenUpdate: data.lastTokenUpdate
      };
    });
    
    console.log('All guardians:', guardians);
    
    return NextResponse.json({ 
      success: true, 
      guardians: guardians,
      totalGuardians: guardians.length,
      guardiansWithTokens: guardians.filter(g => g.hasFcmToken).length
    });
  } catch (err) {
    console.error('Error checking guardians:', err);
    return NextResponse.json({ 
      error: 'Failed to check guardians',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let guardianId: string | undefined;
  let fcmToken: string | undefined;
  
  try {
    const { guardianId: reqGuardianId, patientName, patientId, location, description, severity } = await req.json();
    guardianId = reqGuardianId;

    console.log('=== EMERGENCY NOTIFICATION REQUEST ===');
    console.log('Guardian ID:', guardianId);
    console.log('Patient Name:', patientName);
    console.log('Patient ID:', patientId);
    console.log('Location:', location);
    console.log('Description:', description);
    console.log('Severity:', severity);

    // Validate required fields
    if (!guardianId || !patientName || !patientId) {
      console.log('Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: guardianId, patientName, patientId' 
      }, { status: 400 });
    }

    // Get guardian's FCM token from Firestore
    // guardianId is actually the guardian's uid in the users collection
    console.log('Looking up guardian document with ID:', guardianId);
    const guardianDoc = await adminDb.collection('users').doc(guardianId).get();
    
    if (!guardianDoc.exists) {
      console.log('Guardian document does not exist for ID:', guardianId);
      return NextResponse.json({ error: 'Guardian not found' }, { status: 404 });
    }

    const guardianData = guardianDoc.data();
    console.log('Guardian data found:', {
      uid: guardianData?.uid,
      name: guardianData?.name,
      role: guardianData?.role,
      hasFcmToken: !!guardianData?.fcmToken
    });

    fcmToken = guardianData?.fcmToken;
    console.log('FCM token found:', !!fcmToken);
    if (fcmToken) {
      console.log('FCM token preview:', fcmToken.substring(0, 20) + '...');
    }
    
    if (!fcmToken) {
      console.log('No FCM token found for guardian:', guardianId);
      return NextResponse.json({ error: 'No FCM token for guardian' }, { status: 400 });
    }

    // Create notification title and body
    const notificationTitle = 'EMERGENCY ALERT';
    const notificationBody = `Emergency situation detected for ${patientName}${location ? ` at ${location}` : ''}`;

    console.log('Sending FCM notification to token:', fcmToken.substring(0, 20) + '...');
    console.log('Notification title:', notificationTitle);
    console.log('Notification body:', notificationBody);

    // Send FCM notification
    const messageResult = await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        type: 'emergency',
        patientId: patientId,
        patientName: patientName,
        location: location || '',
        description: description || '',
        severity: severity || 'critical',
        timestamp: new Date().toISOString(),
      },
      android: {
        notification: {
          channelId: 'emergency_channel',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
          icon: '@mipmap/ic_launcher',
          color: '#FF0000',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notificationTitle,
              body: notificationBody,
            },
            sound: 'alarm.mp3',
            badge: 1,
            category: 'EMERGENCY',
          },
        },
      },
    });

    console.log('FCM message sent successfully. Message ID:', messageResult);
    console.log('Emergency notification sent successfully to guardian:', guardianId);
    console.log('=== END EMERGENCY NOTIFICATION ===');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Emergency notification sent successfully',
      guardianId: guardianId,
      patientId: patientId,
      messageId: messageResult
    });
  } catch (err: any) {
    console.error('=== ERROR SENDING EMERGENCY NOTIFICATION ===');
    console.error('Error details:', err);
    
    // Check if it's an invalid token error
    if (err.code === 'messaging/invalid-registration-token' || 
        err.code === 'messaging/registration-token-not-registered' ||
        err.message?.includes('Requested entity was not found')) {
      
      console.log('Invalid FCM token detected, removing from Firestore');
      
      if (guardianId && fcmToken) {
        try {
          // Only remove the token if it's definitely invalid
          // Check if the token in Firestore matches the one we tried to send
          const guardianDoc = await adminDb.collection('users').doc(guardianId).get();
          if (guardianDoc.exists) {
            const storedToken = guardianDoc.data()?.fcmToken;
            if (storedToken && storedToken === fcmToken) {
              // Remove the invalid token from Firestore
              await adminDb.collection('users').doc(guardianId).update({
                fcmToken: admin.firestore.FieldValue.delete(),
                lastTokenUpdate: new Date().toISOString(),
              });
              console.log('Invalid FCM token removed from Firestore for guardian:', guardianId);
            } else {
              console.log('Token mismatch - not removing from Firestore. Stored:', storedToken?.substring(0, 20), 'Sent:', fcmToken?.substring(0, 20));
            }
          }
        } catch (cleanupError) {
          console.error('Error removing invalid FCM token:', cleanupError);
        }
      }
      
      return NextResponse.json({ 
        error: 'Invalid FCM token - token has been removed',
        details: 'The guardian\'s FCM token was invalid and has been cleared. They need to log in again to receive notifications.',
        guardianId: guardianId
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to send notification',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}