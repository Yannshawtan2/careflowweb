import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';

export interface UserSession {
  uid: string;
  email: string;
  role: string;
  name?: string;
}

export async function verifySession(request: NextRequest): Promise<UserSession | null> {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('No session cookie found');
      return null;
    }

    // Verify Firebase session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    if (!decodedClaims) {
      console.log('Invalid session cookie');
      return null;
    }

    // Get user data from database
    const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
    
    if (!userDoc.exists) {
      console.log('User not found in database');
      return null;
    }

    const userData = userDoc.data();
    
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || userData?.email || '',
      role: userData?.role || 'user',
      name: userData?.name
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

export async function getServerSession(request: NextRequest): Promise<UserSession | null> {
  return await verifySession(request);
}
