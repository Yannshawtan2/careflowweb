"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Guardian {
  uid: string
  name: string
  email: string
  hasFcmToken: boolean
  fcmTokenPreview: string
}

interface Patient {
  id: string
  name: string
  guardianId: string
  guardianName: string
}

export default function TestNotificationPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedGuardian, setSelectedGuardian] = useState("")
  const [selectedPatient, setSelectedPatient] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch guardians
      const guardiansRes = await fetch('/api/notify-guardian')
      const guardiansData = await guardiansRes.json()
      
      if (guardiansData.success) {
        setGuardians(guardiansData.guardians)
      }

      // Fetch patients
      const patientsSnapshot = await getDocs(collection(db, 'patients'))
      const patientsData = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[]
      
      setPatients(patientsData)
      toast.success(`Loaded ${guardiansData.guardians.length} guardians and ${patientsData.length} patients`)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  const sendTestNotification = async () => {
    if (!selectedGuardian || !selectedPatient) {
      toast.error('Please select both a guardian and a patient')
      return
    }

    const patient = patients.find(p => p.id === selectedPatient)
    if (!patient) {
      toast.error('Selected patient not found')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/notify-guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardianId: selectedGuardian,
          patientName: patient.name,
          patientId: patient.id,
          location: 'Test Location',
          description: 'This is a test emergency notification',
          severity: 'test'
        }),
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success('Test notification sent successfully!')
        console.log('Test notification response:', data)
      } else {
        toast.error(data.error || 'Failed to send test notification')
        console.error('Test notification error:', data)
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Error sending test notification')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#A0C878]">Test Emergency Notifications</h1>
          <p className="text-muted-foreground">Send test emergency notifications to specific guardians</p>
        </div>
        <Button onClick={fetchData} disabled={loading} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
          Refresh Data
        </Button>
      </div>

      <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
        <CardHeader>
          <CardTitle>Send Test Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="guardian">Select Guardian</Label>
              <Select value={selectedGuardian} onValueChange={setSelectedGuardian}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a guardian" />
                </SelectTrigger>
                <SelectContent>
                  {guardians.map((guardian) => (
                    <SelectItem key={guardian.uid} value={guardian.uid}>
                      {guardian.name} ({guardian.hasFcmToken ? 'Has Token' : 'No Token'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="patient">Select Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} (Guardian: {patient.guardianName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={sendTestNotification} 
            disabled={!selectedGuardian || !selectedPatient || sending}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {sending ? 'Sending...' : 'Send Test Emergency Notification'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader>
            <CardTitle>Guardians ({guardians.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {guardians.map((guardian) => (
                <div key={guardian.uid} className="flex items-center justify-between p-2 bg-white rounded">
                  <span>{guardian.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${guardian.hasFcmToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {guardian.hasFcmToken ? 'Has Token' : 'No Token'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader>
            <CardTitle>Patients ({patients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patients.map((patient) => (
                <div key={patient.id} className="p-2 bg-white rounded">
                  <div className="font-medium">{patient.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Guardian: {patient.guardianName} ({patient.guardianId})
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0C878] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      )}
    </div>
  )
} 