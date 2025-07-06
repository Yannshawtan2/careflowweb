// app/api/guardians/route.ts
import { adminDb } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

export async function GET() {
  try {
    // Query users with role 'guardian'
    const guardiansSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'guardian')
      .get()

    const guardians = guardiansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(guardians)
  } catch (error) {
    console.error('Error fetching guardians:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guardians' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== POST /api/guardians called ===');
    const body = await req.json();
    console.log('Request body:', body);
    
    const { guardianId, patientData } = body;
    
    if (!guardianId || !patientData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing guardianId or patientData' 
      }, { status: 400 });
    }
    
    // Generate a unique ID for the patient
    const patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create patient document in Firestore under the patients collection
    await adminDb.collection('patients').doc(patientId).set({
      id: patientId,
      ...patientData,
      guardianId: guardianId
    });
    
    // Also update the guardian's document to include the patient reference
    await adminDb.collection('users').doc(guardianId).update({
      patientId: patientId,
      updatedAt: new Date().toISOString()
    });
    
    console.log('Patient created with ID:', patientId);
    return NextResponse.json({ success: true, patientId: patientId });
  } catch (error: any) {
    console.error('Patient creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}