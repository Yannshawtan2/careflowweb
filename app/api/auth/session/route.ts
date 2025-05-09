import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    
    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 