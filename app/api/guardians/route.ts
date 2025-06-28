// app/api/guardians/[id]/route.ts
import { adminDb } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

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