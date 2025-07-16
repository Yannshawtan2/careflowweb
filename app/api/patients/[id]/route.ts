import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== GET /api/patients/[id] called ===');
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing patient ID' 
      }, { status: 400 });
    }
    
    // Get patient document from patients collection
    const patientDoc = await adminDb.collection('patients').doc(id).get();
    
    if (!patientDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Patient not found' 
      }, { status: 404 });
    }
    
    const patientData = patientDoc.data();
    
    // Add role field for consistency with the form
    const patientWithRole = {
      ...patientData,
      role: 'patient'
    };
    
    console.log('Patient fetched:', patientWithRole);
    return NextResponse.json({ success: true, patient: patientWithRole });
  } catch (error: any) {
    console.error('Fetch patient error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  
} 