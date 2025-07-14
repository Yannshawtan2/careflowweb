"use client"

import { useState, useEffect } from "react"
import { Search, Eye, Edit, Trash2, Plus, FileText, Calendar, User, Stethoscope } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Patient, ClinicalNote } from "@/lib/types"
import { toast } from "sonner"

export default function EHRPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([])
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    assessmentType: "daily" as "daily" | "weekly" | "incident" | "care_plan" | "medication_review",
    assessmentData: {
      mentalStatus: "",
      physicalStatus: "",
      painLevel: 0,
      mobilityAssessment: "",
      skinAssessment: "",
      nutritionAssessment: "",
      behavioralObservations: "",
      carePlanUpdates: "",
      incidentDetails: "",
      medicationChanges: "",
      professionalObservations: ""
    },
    customFields: [] as Array<{ key: string; value: string; description: string }>
  })

  // Custom field management for edit form
  const [newEditCustomField, setNewEditCustomField] = useState({
    key: "",
    value: "",
    description: ""
  })

  const assessmentTypes = [
    { value: "daily", label: "Daily Assessment" },
    { value: "weekly", label: "Weekly Assessment" },
    { value: "incident", label: "Incident Report" },
    { value: "care_plan", label: "Care Plan Update" },
    { value: "medication_review", label: "Medication Review" }
  ]

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    filterPatients()
  }, [patients, searchQuery])

  const fetchPatients = async () => {
    try {
      setIsLoading(true)
      const patientsSnapshot = await getDocs(collection(db, 'patients'))
      const patientsData = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient))

      // Sort by name
      const sortedPatients = patientsData.sort((a, b) => a.name.localeCompare(b.name))
      setPatients(sortedPatients)
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
    if (!searchQuery) {
      setFilteredPatients(patients)
      return
    }

    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.guardianName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredPatients(filtered)
  }

  const fetchClinicalNotes = async (patientId: string) => {
    try {
      setIsLoadingNotes(true)
      const response = await fetch(`/api/clinical-notes?patientId=${patientId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch clinical notes')
      }
      const data = await response.json()
      setClinicalNotes(data.clinicalNotes || [])
    } catch (error) {
      console.error('Error fetching clinical notes:', error)
      toast.error("Error loading clinical notes", {
        description: "Failed to load clinical notes. Please try again.",
      })
    } finally {
      setIsLoadingNotes(false)
    }
  }

  const handleViewNotes = async (patient: Patient) => {
    setSelectedPatient(patient)
    setIsNotesModalOpen(true)
    await fetchClinicalNotes(patient.id)
  }

  const handleViewNote = (note: ClinicalNote) => {
    setSelectedNote(note)
    setIsViewModalOpen(true)
  }

  const handleEditNote = (note: ClinicalNote) => {
    setSelectedNote(note)
    
    // Extract custom fields from the note data
    const standardFields = ['mentalStatus', 'physicalStatus', 'painLevel', 'mobilityAssessment', 'skinAssessment', 'nutritionAssessment', 'behavioralObservations', 'carePlanUpdates', 'incidentDetails', 'medicationChanges', 'professionalObservations']
    const customFields = Object.entries(note.assessmentData)
      .filter(([key]) => !standardFields.includes(key))
      .map(([key, value]) => ({
        key,
        value: String(value),
        description: ""
      }))
    
    setEditForm({
      assessmentType: note.assessmentType,
      assessmentData: {
        mentalStatus: note.assessmentData.mentalStatus || "",
        physicalStatus: note.assessmentData.physicalStatus || "",
        painLevel: note.assessmentData.painLevel || 0,
        mobilityAssessment: note.assessmentData.mobilityAssessment || "",
        skinAssessment: note.assessmentData.skinAssessment || "",
        nutritionAssessment: note.assessmentData.nutritionAssessment || "",
        behavioralObservations: note.assessmentData.behavioralObservations || "",
        carePlanUpdates: note.assessmentData.carePlanUpdates || "",
        incidentDetails: note.assessmentData.incidentDetails || "",
        medicationChanges: note.assessmentData.medicationChanges || "",
        professionalObservations: note.assessmentData.professionalObservations || ""
      },
      customFields: customFields
    })
    setIsEditModalOpen(true)
  }

  const addEditCustomField = () => {
    if (newEditCustomField.key.trim() && newEditCustomField.value.trim()) {
      setEditForm(prev => ({
        ...prev,
        customFields: [...prev.customFields, {
          key: newEditCustomField.key.trim(),
          value: newEditCustomField.value.trim(),
          description: newEditCustomField.description.trim()
        }]
      }))
      setNewEditCustomField({ key: "", value: "", description: "" })
    }
  }

  const removeEditCustomField = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }))
  }

  const handleUpdateNote = async () => {
    if (!selectedNote) return

    try {
      // Convert custom fields to assessment data
      const customFieldsData: any = {}
      editForm.customFields.forEach(field => {
        if (field.key && field.value) {
          customFieldsData[field.key] = field.value
        }
      })

      // Debug: log the selectedNote id and object
      console.log('Updating note with id:', selectedNote.id, selectedNote);

      const response = await fetch(`/api/clinical-notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentType: editForm.assessmentType,
          assessmentData: {
            ...editForm.assessmentData,
            ...customFieldsData
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update clinical note')
      }

      toast.success("Clinical note updated successfully")
      setIsEditModalOpen(false)
      if (selectedPatient) {
        await fetchClinicalNotes(selectedPatient.id)
      }
    } catch (error) {
      console.error('Error updating clinical note:', error)
      toast.error("Error updating note", {
        description: "Failed to update clinical note. Please try again.",
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this clinical note? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/clinical-notes/${noteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete clinical note')
      }

      toast.success("Clinical note deleted successfully")
      if (selectedPatient) {
        await fetchClinicalNotes(selectedPatient.id)
      }
    } catch (error) {
      console.error('Error deleting clinical note:', error)
      toast.error("Error deleting note", {
        description: "Failed to delete clinical note. Please try again.",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAssessmentTypeColor = (type: string) => {
    switch (type) {
      case "daily": return "bg-blue-100 text-blue-800"
      case "weekly": return "bg-green-100 text-green-800"
      case "incident": return "bg-red-100 text-red-800"
      case "care_plan": return "bg-purple-100 text-purple-800"
      case "medication_review": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getCareTypeColor = (careLevel: string) => {
    switch (careLevel) {
      case "low": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "high": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0C878] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading EHR data...</p>
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
          <h1 className="text-3xl font-bold text-[#A0C878] flex items-center gap-2">
            <Stethoscope className="h-8 w-8" />
            Electronic Health Records
          </h1>
          <p className="text-muted-foreground">View and manage patient clinical notes and assessments</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <User className="h-4 w-4 text-[#A0C878]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground">Active patients</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Care Level</CardTitle>
            <FileText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {patients.filter(p => p.careLevel === "high").length}
            </div>
            <p className="text-xs text-muted-foreground">Require special attention</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Results</CardTitle>
            <Search className="h-4 w-4 text-[#A0C878]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPatients.length}</div>
            <p className="text-xs text-muted-foreground">Matching patients</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Records</CardTitle>
            <Calendar className="h-4 w-4 text-[#A0C878]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.filter(p => p.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Currently admitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search patients by name, room number, or guardian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-[#DDEB9D] focus:ring-[#A0C878]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Patient Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Care Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.roomNumber}</TableCell>
                  <TableCell>{patient.guardianName}</TableCell>
                  <TableCell>
                    <Badge className={getCareTypeColor(patient.careLevel)}>
                      {patient.careLevel?.toUpperCase() || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                      {patient.status?.toUpperCase() || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleViewNotes(patient)}
                      className="bg-[#A0C878] hover:bg-[#8AB868] text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Clinical Notes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No patients found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinical Notes Modal */}
      <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent className="!w-screen !h-[98vh] !max-w-none !max-h-none overflow-y-auto !p-1 !m-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Clinical Notes - {selectedPatient?.name}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingNotes ? (
                      <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#A0C878]"></div>
          </div>
        ) : (
          <div className="space-y-4 w-full overflow-x-auto">
              <Table className="w-full min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead className="w-[160px]">Assessment Type</TableHead>
                    <TableHead className="w-[140px]">Nurse</TableHead>
                    <TableHead className="w-auto min-w-[300px]">Summary</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinicalNotes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell>{formatDate(note.timestamp)}</TableCell>
                      <TableCell>
                        <Badge className={getAssessmentTypeColor(note.assessmentType)}>
                          {assessmentTypes.find(t => t.value === note.assessmentType)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{note.nurseName}</TableCell>
                      <TableCell className="min-w-[300px] max-w-[500px] whitespace-normal break-words">
                        {note.assessmentData.professionalObservations || 
                         note.assessmentData.mentalStatus || 
                         'No summary available'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewNote(note)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditNote(note)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {clinicalNotes.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No clinical notes found</h3>
                  <p className="text-muted-foreground">This patient has no clinical notes recorded yet.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Note Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="!w-screen !h-[98vh] !max-w-none !max-h-none overflow-y-auto !p-1 !m-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Clinical Note Details</DialogTitle>
          </DialogHeader>
          
          {selectedNote && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
                  <p className="text-sm font-semibold">{formatDate(selectedNote.timestamp)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Assessment Type</Label>
                  <div className="mt-1">
                    <Badge className={getAssessmentTypeColor(selectedNote.assessmentType)}>
                      {assessmentTypes.find(t => t.value === selectedNote.assessmentType)?.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nurse</Label>
                  <p className="text-sm font-semibold">{selectedNote.nurseName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Pain Level</Label>
                  <p className="text-sm font-semibold">{selectedNote.assessmentData.painLevel || 0}/10</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {Object.entries(selectedNote.assessmentData).map(([key, value]) => {
                  if (!value || key === 'painLevel') return null
                  return (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm font-medium text-[#2E7D32] capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <div className="p-4 bg-[#FAF6E9] border border-[#DDEB9D] rounded-lg">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Note Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="!w-[70vw] !h-[70vh] !max-w-none !max-h-none overflow-y-auto !p-3 !m-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Clinical Note</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1 flex-1">
                <Label className="text-[#2E7D32] font-medium text-sm">Assessment Type</Label>
                <Select 
                  value={editForm.assessmentType} 
                  onValueChange={(value: any) => setEditForm(prev => ({ ...prev, assessmentType: value }))}
                >
                  <SelectTrigger className="border-[#DDEB9D] focus:ring-[#A0C878]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assessmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Mental and Physical Status */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-[#2E7D32]">Mental & Physical Assessment</h3>
                
                <div className="space-y-2">
                  <Label className="text-[#2E7D32] font-medium text-sm">Mental Status</Label>
                  <Textarea
                    value={editForm.assessmentData.mentalStatus}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      assessmentData: { ...prev.assessmentData, mentalStatus: e.target.value }
                    }))}
                    placeholder="Describe mental status, cognition, behavior..."
                    rows={2}
                    className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#2E7D32] font-medium text-sm">Physical Status</Label>
                  <Textarea
                    value={editForm.assessmentData.physicalStatus}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      assessmentData: { ...prev.assessmentData, physicalStatus: e.target.value }
                    }))}
                    placeholder="Describe physical condition, mobility, strength..."
                    rows={2}
                    className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#2E7D32] font-medium text-sm">Pain Level (0-10)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={editForm.assessmentData.painLevel}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        assessmentData: { ...prev.assessmentData, painLevel: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-16 border-[#DDEB9D] focus:ring-[#A0C878]"
                    />
                    <Progress value={editForm.assessmentData.painLevel * 10} className="flex-1" />
                  </div>
                </div>
              </div>

              {/* Specialized Assessments */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-[#2E7D32]">Specialized Assessments</h3>
                
                <div className="space-y-2">
                  <Label className="text-[#2E7D32] font-medium text-sm">Mobility Assessment</Label>
                  <Textarea
                    value={editForm.assessmentData.mobilityAssessment}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      assessmentData: { ...prev.assessmentData, mobilityAssessment: e.target.value }
                    }))}
                                      placeholder="Assess mobility, gait, balance, transfers..."
                  rows={2}
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#2E7D32] font-medium text-sm">Skin Assessment</Label>
                <Textarea
                  value={editForm.assessmentData.skinAssessment}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    assessmentData: { ...prev.assessmentData, skinAssessment: e.target.value }
                  }))}
                  placeholder="Skin condition, pressure areas, wounds..."
                  rows={2}
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#2E7D32] font-medium text-sm">Nutrition Assessment</Label>
                <Textarea
                  value={editForm.assessmentData.nutritionAssessment}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    assessmentData: { ...prev.assessmentData, nutritionAssessment: e.target.value }
                  }))}
                  placeholder="Nutritional status, hydration, dietary needs..."
                  rows={2}
                    className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  />
                </div>
              </div>
            </div>

            {/* Behavioral and Professional Observations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#2E7D32]">Behavioral & Professional Notes</h3>
              
              <div className="space-y-2">
                <Label className="text-[#2E7D32] font-medium">Behavioral Observations</Label>
                <Textarea
                  value={editForm.assessmentData.behavioralObservations}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    assessmentData: { ...prev.assessmentData, behavioralObservations: e.target.value }
                  }))}
                  placeholder="Behavioral changes, mood, social interactions..."
                  rows={3}
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#2E7D32] font-medium">Care Plan Updates</Label>
                <Textarea
                  value={editForm.assessmentData.carePlanUpdates}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    assessmentData: { ...prev.assessmentData, carePlanUpdates: e.target.value }
                  }))}
                  placeholder="Updates to care plan, interventions, goals..."
                  rows={3}
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
              </div>

              {editForm.assessmentType === "incident" && (
                <div className="space-y-2">
                  <Label className="text-[#2E7D32] font-medium">Incident Details</Label>
                  <Textarea
                    value={editForm.assessmentData.incidentDetails}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      assessmentData: { ...prev.assessmentData, incidentDetails: e.target.value }
                    }))}
                    placeholder="Detailed description of incident, circumstances, actions taken..."
                    rows={4}
                    className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  />
                </div>
              )}

              {editForm.assessmentType === "medication_review" && (
                <div className="space-y-2">
                  <Label className="text-[#2E7D32] font-medium">Medication Changes</Label>
                  <Textarea
                    value={editForm.assessmentData.medicationChanges}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      assessmentData: { ...prev.assessmentData, medicationChanges: e.target.value }
                    }))}
                    placeholder="Medication changes, side effects, effectiveness..."
                    rows={3}
                    className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[#2E7D32] font-medium">Professional Observations</Label>
                <Textarea
                  value={editForm.assessmentData.professionalObservations}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    assessmentData: { ...prev.assessmentData, professionalObservations: e.target.value }
                  }))}
                  placeholder="Professional clinical observations, concerns, recommendations..."
                  rows={4}
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
              </div>
            </div>

            {/* Custom Fields Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#2E7D32] flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Custom Fields
              </h3>
              <p className="text-sm text-muted-foreground">
                Add additional fields specific to this patient's health needs
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <Input
                  value={newEditCustomField.key}
                  onChange={(e) => setNewEditCustomField(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="Field name (e.g., Blood Sugar)"
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
                <Input
                  value={newEditCustomField.value}
                  onChange={(e) => setNewEditCustomField(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Value"
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
                <Button onClick={addEditCustomField} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                  Add Field
                </Button>
              </div>
              
              <Input
                value={newEditCustomField.description}
                onChange={(e) => setNewEditCustomField(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Field description (optional)"
                className="border-[#DDEB9D] focus:ring-[#A0C878]"
              />

              {/* Display custom fields */}
              <div className="space-y-2">
                {editForm.customFields.map((field, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#2E7D32]">{field.key}:</span>
                        <span className="text-gray-700">{field.value}</span>
                      </div>
                      {field.description && (
                        <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEditCustomField(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateNote} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                Update Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
