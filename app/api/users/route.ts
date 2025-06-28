import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    console.log('Received POST /api/users');
    const body = await req.json();
    console.log('Request body:', body);
    const { name, email, phone, password, role, startDate, permissions } = body;

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: "+60" + phone || undefined,
    });

    // Add user document to Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      phone,
      role,
      startDate,
      permissions: permissions || [],
      createdAt: new Date().toISOString(),
    });

    console.log('User created with UID:', userRecord.uid);
    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error('User creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    console.log('Received GET /api/users');
    const snapshot = await adminDb.collection('users').get();
    const users = snapshot.docs.map(doc => doc.data());
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url!);
    const uid = searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Missing uid' }, { status: 400 });
    }
    console.log('Received DELETE /api/users for uid:', uid);
    // Delete from Auth
    await adminAuth.deleteUser(uid);
    // Delete from Firestore
    await adminDb.collection('users').doc(uid).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url!);
    const uid = searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Missing uid' }, { status: 400 });
    }
    const body = await req.json();
    const { name, email, phone, password, role, startDate, permissions } = body;
    console.log('Received PUT /api/users for uid:', uid, body);
    // Update Auth fields
    const updateAuth: any = { displayName: name, email, phoneNumber: phone };
    if (password) updateAuth.password = password;
    await adminAuth.updateUser(uid, updateAuth);
    // Update Firestore
    await adminDb.collection('users').doc(uid).update({
      name,
      email,
      phone,
      role,
      startDate,
      permissions: permissions || [],
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 