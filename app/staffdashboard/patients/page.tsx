"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus, Phone, AlertTriangle, Heart, Activity, Pill } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PatientCard } from "@/components/patients/patient-card"
import { AddPatientModal } from "@/components/patients/add-patient-modal"
import { PatientHealthModal } from "@/components/patients/patient-health-modal"
import { EmergencyContactModal } from "@/components/patients/emergency-contact-modal"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Patient, HealthRecord, ClinicalNote } from "@/lib/types"
import { toast } from "sonner"

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [careLevelFilter, setCareLevelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false)
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    filterPatients()
  }, [patients, searchQuery, careLevelFilter, statusFilter])

  const fetchPatients = async () => {
    try {
      setIsLoading(true)
      
      // Fetch patients from the patients collection
      const patientsSnapshot = await getDocs(collection(db, 'patients'))
      const patientsData = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as any))
      
      console.log('Patients from database:', patientsData)
      
      // Sort by createdAt if available, otherwise by name
      const sortedPatients = patientsData.sort((a: any, b: any) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0)
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0)
        return bDate.getTime() - aDate.getTime()
      }) as Patient[]
      
      console.log('Sorted patients:', sortedPatients)

      // Fetch health records
      const healthSnapshot = await getDocs(collection(db, 'healthRecords'))
      const healthData = healthSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HealthRecord[]

      // Fetch clinical notes from separate collection
      const clinicalNotesSnapshot = await getDocs(collection(db, 'clinicalNotes'))
      const clinicalNotesData = clinicalNotesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClinicalNote[]

      setPatients(sortedPatients)
      setHealthRecords(healthData)
      setClinicalNotes(clinicalNotesData)
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error("Error loading patients", {
        description: "Failed to load patient data. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterPatients = () => {
    let filtered = patients

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.guardianName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Care level filter
    if (careLevelFilter !== "all") {
      filtered = filtered.filter(patient => patient.careLevel === careLevelFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(patient => patient.status === statusFilter)
    }

    setFilteredPatients(filtered)
  }

  const handleEmergencyContact = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsEmergencyModalOpen(true)
  }

  const handleHealthUpdate = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsHealthModalOpen(true)
  }

  const getPatientHealthSummary = (patientId: string) => {
    const record = healthRecords.find(hr => hr.patientId === patientId)
    const patientClinicalNotes = clinicalNotes.filter(cn => cn.patientId === patientId)
    
    if (!record) return null

    const currentFamilyUpdate = record.currentFamilyVisibleUpdate
    const latestClinicalNote = patientClinicalNotes.length > 0 
      ? patientClinicalNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      : null

    return {
      lastFamilyUpdate: currentFamilyUpdate?.timestamp,
      lastClinicalNote: latestClinicalNote?.timestamp,
      mood: currentFamilyUpdate?.mood,
      vitals: currentFamilyUpdate?.vitals
    }
  }

  const getCareLevelColor = (careLevel: string) => {
    if (!careLevel) return "bg-gray-100 text-gray-800"
    switch (careLevel) {
      case "low": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "high": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800"
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800"
      case "discharged": return "bg-gray-100 text-gray-800"
      case "transferred": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0C878] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading patients...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#A0C878]">Patient Management</h1>
          <p className="text-muted-foreground">Manage and monitor patient health data</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Heart className="h-4 w-4 text-[#A0C878]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.filter(p => p.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Active patients</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Care Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {patients.filter(p => p.status === "active" && p.careLevel === "high").length}
            </div>
            <p className="text-xs text-muted-foreground">Require special attention</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medication Due</CardTitle>
            <Pill className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {patients.filter(p => p.status === "active" && p.medications && p.medications.length > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">On medication</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search patients by name, room, or guardian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-[#DDEB9D] focus:ring-[#A0C878]"
                />
              </div>
            </div>
            <Select value={careLevelFilter} onValueChange={setCareLevelFilter}>
              <SelectTrigger className="w-[180px] bg-white border-[#DDEB9D] focus:ring-[#A0C878]">
                <SelectValue placeholder="Care Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Care Levels</SelectItem>
                <SelectItem value="low">Low Care</SelectItem>
                <SelectItem value="medium">Medium Care</SelectItem>
                <SelectItem value="high">High Care</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white border-[#DDEB9D] focus:ring-[#A0C878]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="discharged">Discharged</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patient Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((patient) => {
          const healthSummary = getPatientHealthSummary(patient.id)
          return (
            <PatientCard
              key={patient.id}
              patient={patient}
              healthSummary={healthSummary}
              onHealthUpdate={() => handleHealthUpdate(patient)}
              getCareLevelColor={getCareLevelColor}
              getStatusColor={getStatusColor}
            />
          )
        })}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No patients found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Modals */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPatientAdded={fetchPatients}
      />

      {selectedPatient && (
        <>
          <PatientHealthModal
            isOpen={isHealthModalOpen}
            onClose={() => setIsHealthModalOpen(false)}
            patient={selectedPatient}
            onUpdate={fetchPatients}
          />
          <EmergencyContactModal
            isOpen={isEmergencyModalOpen}
            onClose={() => setIsEmergencyModalOpen(false)}
            patient={selectedPatient}
          />
        </>
      )}
    </div>
  )
} 