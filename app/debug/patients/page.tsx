"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Patient {
  id: string
  name: string
  guardianId: string
  guardianName: string
  roomNumber: string
  careLevel: string
  status: string
}

export default function DebugPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const patientsSnapshot = await getDocs(collection(db, 'patients'))
      const patientsData = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[]
      
      setPatients(patientsData)
      toast.success(`Found ${patientsData.length} patients`)
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Error fetching patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#A0C878]">Debug Patients</h1>
          <p className="text-muted-foreground">Check all patients and their guardian associations</p>
        </div>
        <Button onClick={fetchPatients} disabled={loading} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {patients.map((patient) => (
          <Card key={patient.id} className="bg-[#FAF6E9] border-[#DDEB9D]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{patient.name}</span>
                <div className="flex gap-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {patient.careLevel} Care
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    {patient.status}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Patient ID:</strong> {patient.id}</p>
              <p><strong>Room:</strong> {patient.roomNumber}</p>
              <p><strong>Guardian ID:</strong> {patient.guardianId}</p>
              <p><strong>Guardian Name:</strong> {patient.guardianName}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {patients.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No patients found</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0C878] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading patients...</p>
        </div>
      )}
    </div>
  )
} 