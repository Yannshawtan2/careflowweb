import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    console.log('=== POST /api/users called ===');
    const body = await req.json();
    console.log('Request body:', body);
    
    const { 
      name, 
      email, 
      phone, 
      password, 
      role, 
      startDate,
      // Patient-specific fields
      dateOfBirth,
      roomNumber,
      guardianId,
      guardianName,
      guardianPhone,
      emergencyContact,
      medicalHistory,
      allergies,
      medications,
      careLevel,
      status,
      admissionDate
    } = body;

    // Handle patient creation (no Firebase Auth required)
    if (role === 'patient') {
      console.log('Creating patient record');
      
      // Generate a unique ID for the patient
      const patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create patient document in Firestore under patients collection instead of users
      await adminDb.collection('patients').doc(patientId).set({
        id: patientId,
        name,
        email: email || `patient_${patientId}@careflow.local`,
        phone: phone || '',
        dateOfBirth,
        roomNumber,
        guardianId,
        guardianName,
        guardianPhone,
        emergencyContact,
        medicalHistory: medicalHistory || [],
        allergies: allergies || [],
        medications: medications || [],
        careLevel: careLevel || 'medium',
        status: status || 'active',
        admissionDate: admissionDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('Patient created with ID:', patientId);
      return NextResponse.json({ success: true, uid: patientId });
    }

    // Handle regular user creation (requires Firebase Auth)
    console.log('Creating regular user');
    console.log('Password length:', password?.length, 'Password empty:', password === '');
    
    // Validate password for new user creation
    if (!password || password.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: 'Password is required for new user creation' 
      }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone ? "+60" + phone : undefined,
    });

    // Add user document to Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      phone,
      role,
      startDate,
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
    
    // Only return users (staff, admins, guardians) - not patients
    return NextResponse.json({ success: true, users: users });
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
    
    // First, try to find the user document to get the actual Firebase Auth UID
    let firebaseUid = uid;
    let documentId = uid;
    
    // If the uid looks like an email, search by email
    if (uid.includes('@')) {
      const usersSnapshot = await adminDb.collection('users').where('email', '==', uid).get();
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        documentId = userDoc.id;
        firebaseUid = userDoc.data().uid || uid;
      }
    } else {
      // Try to get the document to see if it has a uid field
      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          firebaseUid = userData?.uid || uid;
        }
      } catch (error) {
        console.log('Document not found by ID, trying as Firebase UID');
      }
    }
    
    // Try to delete from Firebase Auth (only if it's a valid UID)
    try {
      await adminAuth.deleteUser(firebaseUid);
      console.log('User deleted from Firebase Auth');
    } catch (authError: any) {
      console.log('Could not delete from Firebase Auth:', authError.message);
      // Continue with Firestore deletion even if Auth deletion fails
    }
    
    // Check if it's a patient (starts with 'patient_')
    if (documentId.startsWith('patient_')) {
      // Delete from patients collection
      await adminDb.collection('patients').doc(documentId).delete();
      console.log('Patient deleted from patients collection');
    } else {
      // Delete from users collection
      await adminDb.collection('users').doc(documentId).delete();
      console.log('User deleted from users collection');
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log('=== PUT /api/users called ===');
    const { searchParams } = new URL(req.url!);
    const uid = searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Missing uid' }, { status: 400 });
    }
    const body = await req.json();
    console.log('PUT Request body:', body);
    const { 
      name, 
      email, 
      phone, 
      password, 
      role, 
      startDate, 
      permissions,
      // Patient-specific fields
      dateOfBirth,
      roomNumber,
      guardianName,
      guardianPhone,
      emergencyContact,
      medicalHistory,
      allergies,
      medications,
      careLevel,
      status
    } = body;
    
    console.log('Received PUT /api/users for uid:', uid, body);
    
    // Check if it's a patient (starts with 'patient_')
    if (uid.startsWith('patient_')) {
      // Update patient in patients collection
      const updateData: any = {
        name,
        email,
        phone,
        dateOfBirth,
        roomNumber,
        guardianName,
        guardianPhone,
        emergencyContact,
        medicalHistory,
        allergies,
        medications,
        careLevel,
        status,
        updatedAt: new Date().toISOString(),
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      await adminDb.collection('patients').doc(uid).update(updateData);
      console.log('Patient updated in patients collection');
    } else {
      // Update regular user
      // Update Auth fields (only if password is provided)
    const updateAuth: any = { displayName: name, email, phoneNumber: phone };
      if (password && password.trim() !== '') {
        updateAuth.password = password;
      }
    await adminAuth.updateUser(uid, updateAuth);
      
      // Prepare Firestore update data
      const updateData: any = {
      name,
      email,
      phone,
      role,
      startDate,
      permissions: permissions || [],
      updatedAt: new Date().toISOString(),
      };
      
      // Update Firestore
      await adminDb.collection('users').doc(uid).update(updateData);
      console.log('User updated in users collection');
      
      // If this is a guardian update, also update the associated patient
      if (role === 'guardian' && (dateOfBirth || roomNumber || guardianName || guardianPhone || emergencyContact || medicalHistory || allergies || medications || careLevel || status)) {
        try {
          // Find the patient associated with this guardian
          const patientsSnapshot = await adminDb.collection('patients').where('guardianId', '==', uid).get();
          
          if (!patientsSnapshot.empty) {
            const patientDoc = patientsSnapshot.docs[0];
            const patientUpdateData: any = {
              updatedAt: new Date().toISOString(),
            };
            
            // Only update patient fields that are provided
            if (dateOfBirth !== undefined) patientUpdateData.dateOfBirth = dateOfBirth;
            if (roomNumber !== undefined) patientUpdateData.roomNumber = roomNumber;
            if (guardianName !== undefined) patientUpdateData.guardianName = guardianName;
            if (guardianPhone !== undefined) patientUpdateData.guardianPhone = guardianPhone;
            if (emergencyContact !== undefined) patientUpdateData.emergencyContact = emergencyContact;
            if (medicalHistory !== undefined) patientUpdateData.medicalHistory = medicalHistory;
            if (allergies !== undefined) patientUpdateData.allergies = allergies;
            if (medications !== undefined) patientUpdateData.medications = medications;
            if (careLevel !== undefined) patientUpdateData.careLevel = careLevel;
            if (status !== undefined) patientUpdateData.status = status;
            
            await adminDb.collection('patients').doc(patientDoc.id).update(patientUpdateData);
            console.log('Associated patient updated for guardian:', uid);
          }
        } catch (error) {
          console.error('Error updating associated patient for guardian:', error);
          // Don't fail the entire update if patient update fails
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 