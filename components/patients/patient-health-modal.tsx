"use client"

import { useState, useEffect } from "react"
import { X, Save, Heart, Activity, AlertTriangle, CheckCircle, Clock, Thermometer, Activity as ActivityIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Patient, FamilyVisibleUpdate, ClinicalNote, Vitals, MoodScale, AppetiteLevel, ActivityParticipation, MedicationCompliance } from "@/lib/types"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"

interface PatientHealthModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient
  onUpdate: () => void
}

export function PatientHealthModal({ isOpen, onClose, patient, onUpdate }: PatientHealthModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("family")
  const [hasTodayFamilyUpdate, setHasTodayFamilyUpdate] = useState(false)
  
  // Utility function to remove undefined values from objects
  const removeUndefinedValues = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(removeUndefinedValues).filter(item => item !== undefined)
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {}
      Object.entries(obj).forEach(([key, value]) => {
        if (value !== undefined) {
          cleaned[key] = removeUndefinedValues(value)
        }
      })
      return cleaned
    }
    
    return obj
  }
  
  // Family Visible Updates Form
  const [familyForm, setFamilyForm] = useState({
    vitals: {
      bloodPressure: "",
      temperature: "",
      pulse: "",
      oxygenSaturation: ""
    },
    mood: 3 as 1 | 2 | 3 | 4 | 5,
    appetite: "fair" as "poor" | "fair" | "good",
    activityParticipation: [] as ActivityParticipation[],
    medicationCompliance: [] as MedicationCompliance[],
    generalNotes: ""
  })

  // Clinical Notes Form
  const [clinicalForm, setClinicalForm] = useState({
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

  // Activity and Medication Management
  const [newActivity, setNewActivity] = useState({
    activityType: "",
    duration: "",
    notes: ""
  })
  const [newMedication, setNewMedication] = useState({
    medicationName: "",
    timeGiven: "",
    notes: ""
  })

  // Custom field management
  const [newCustomField, setNewCustomField] = useState({
    key: "",
    value: "",
    description: ""
  })

  const moodOptions = [
    { value: 1, label: "Very Poor", emoji: "😢" },
    { value: 2, label: "Poor", emoji: "😕" },
    { value: 3, label: "Fair", emoji: "😐" },
    { value: 4, label: "Good", emoji: "🙂" },
    { value: 5, label: "Excellent", emoji: "😊" }
  ]

  const appetiteOptions = [
    { value: "poor", label: "Poor", color: "text-red-600" },
    { value: "fair", label: "Fair", color: "text-yellow-600" },
    { value: "good", label: "Good", color: "text-green-600" }
  ]

  const assessmentTypes = [
    { value: "daily", label: "Daily Assessment" },
    { value: "weekly", label: "Weekly Assessment" },
    { value: "incident", label: "Incident Report" },
    { value: "care_plan", label: "Care Plan Update" },
    { value: "medication_review", label: "Medication Review" }
  ]

  useEffect(() => {
    if (isOpen) {
      loadExistingData()
      checkTodayFamilyUpdate().then(setHasTodayFamilyUpdate)
    }
  }, [isOpen, patient.id])

  const loadExistingData = async () => {
    try {
      const healthRecordRef = doc(db, 'healthRecords', patient.id)
      const healthRecordSnap = await getDoc(healthRecordRef)
      
      if (healthRecordSnap.exists()) {
        const data = healthRecordSnap.data()
        const currentFamilyUpdate = data.currentFamilyVisibleUpdate
        
        if (currentFamilyUpdate) {
          setFamilyForm({
            vitals: currentFamilyUpdate.vitals || familyForm.vitals,
            mood: currentFamilyUpdate.mood?.value || 3,
            appetite: currentFamilyUpdate.appetite?.value || "fair",
            activityParticipation: currentFamilyUpdate.activityParticipation || [],
            medicationCompliance: currentFamilyUpdate.medicationCompliance || [],
            generalNotes: currentFamilyUpdate.generalNotes || ""
          })
        }
      }
    } catch (error) {
      console.error('Error loading existing data:', error)
    }
  }

  const handleVitalsChange = (field: keyof Vitals, value: string) => {
    setFamilyForm(prev => ({
      ...prev,
      vitals: { ...prev.vitals, [field]: value }
    }))
  }

  const addActivity = () => {
    if (newActivity.activityType.trim() && newActivity.duration.trim()) {
      const activity: ActivityParticipation = {
        participated: true,
        activityType: newActivity.activityType.trim(),
        duration: newActivity.duration.trim(),
        notes: newActivity.notes.trim() || undefined
      }
      
      setFamilyForm(prev => ({
        ...prev,
        activityParticipation: [...prev.activityParticipation, activity]
      }))
      
      setNewActivity({ activityType: "", duration: "", notes: "" })
    }
  }

  const removeActivity = (index: number) => {
    setFamilyForm(prev => ({
      ...prev,
      activityParticipation: prev.activityParticipation.filter((_, i) => i !== index)
    }))
  }

  const addMedication = () => {
    if (newMedication.medicationName.trim() && newMedication.timeGiven.trim()) {
      const medication: MedicationCompliance = {
        medicationName: newMedication.medicationName.trim(),
        taken: true,
        timeGiven: newMedication.timeGiven.trim(),
        notes: newMedication.notes.trim() || undefined
      }
      
      setFamilyForm(prev => ({
        ...prev,
        medicationCompliance: [...prev.medicationCompliance, medication]
      }))
      
      setNewMedication({ medicationName: "", timeGiven: "", notes: "" })
    }
  }

  const removeMedication = (index: number) => {
    setFamilyForm(prev => ({
      ...prev,
      medicationCompliance: prev.medicationCompliance.filter((_, i) => i !== index)
    }))
  }

  const toggleMedicationTaken = (index: number) => {
    setFamilyForm(prev => ({
      ...prev,
      medicationCompliance: prev.medicationCompliance.map((med, i) => 
        i === index ? { ...med, taken: !med.taken } : med
      )
    }))
  }

  const handleClinicalChange = (field: string, value: string | number) => {
    setClinicalForm(prev => ({
      ...prev,
      assessmentData: { ...prev.assessmentData, [field]: value }
    }))
  }

  const addCustomField = () => {
    if (newCustomField.key.trim() && newCustomField.value.trim()) {
      setClinicalForm(prev => ({
        ...prev,
        customFields: [...prev.customFields, {
          key: newCustomField.key.trim(),
          value: newCustomField.value.trim(),
          description: newCustomField.description.trim()
        }]
      }))
      setNewCustomField({ key: "", value: "", description: "" })
    }
  }

  const removeCustomField = (index: number) => {
    setClinicalForm(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }))
  }

  const checkTodayFamilyUpdate = async (): Promise<boolean> => {
    try {
      const healthRecordRef = doc(db, 'healthRecords', patient.id)
      const healthRecordSnap = await getDoc(healthRecordRef)
      
      if (healthRecordSnap.exists()) {
        const data = healthRecordSnap.data()
        const currentFamilyUpdate = data.currentFamilyVisibleUpdate
        
        if (!currentFamilyUpdate) {
          return false
        }

        const updateDate = new Date(currentFamilyUpdate.timestamp)
        const today = new Date()
        
        return updateDate.toDateString() === today.toDateString()
      }
      
      return false
    } catch (error) {
      console.error('Error checking today\'s family update:', error)
      return false
    }
  }

  const saveFamilyUpdate = async () => {
    try {
      setIsSaving(true)
      
      const familyUpdate: FamilyVisibleUpdate = {
        id: Date.now().toString(),
        patientId: patient.id,
        vitals: familyForm.vitals,
        mood: {
          value: familyForm.mood,
          description: (() => {
            switch (familyForm.mood) {
              case 1: return "Very Poor"
              case 2: return "Poor"
              case 3: return "Fair"
              case 4: return "Good"
              case 5: return "Excellent"
              default: return "Fair"
            }
          })()
        },
        appetite: {
          value: familyForm.appetite,
          description: appetiteOptions.find(a => a.value === familyForm.appetite)?.label || "Fair"
        },
        activityParticipation: familyForm.activityParticipation,
        medicationCompliance: familyForm.medicationCompliance,
        generalNotes: familyForm.generalNotes || "",
        timestamp: new Date().toISOString(),
        nurseId: user?.id || "unknown",
        nurseName: user?.name || user?.email || "Unknown Nurse"
      }
      
      // Clean the family update object to remove any undefined values
      const cleanFamilyUpdate = removeUndefinedValues(familyUpdate)

      const healthRecordRef = doc(db, 'healthRecords', patient.id)
      const healthRecordSnap = await getDoc(healthRecordRef)
      
      if (healthRecordSnap.exists()) {
        const existingData = healthRecordSnap.data()
        await updateDoc(healthRecordRef, {
          currentFamilyVisibleUpdate: cleanFamilyUpdate, // Replace instead of append
          lastUpdated: serverTimestamp()
        })
      } else {
        await setDoc(healthRecordRef, {
          patientId: patient.id,
          currentFamilyVisibleUpdate: cleanFamilyUpdate, // Single object, not array
          lastUpdated: serverTimestamp()
        })
      }

      toast.success("Family update saved successfully")
      setHasTodayFamilyUpdate(true)
      onUpdate()
    } catch (error) {
      console.error('Error saving family update:', error)
      toast.error("Error saving update", {
        description: "Failed to save family update. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const saveClinicalNote = async () => {
    try {
      setIsSaving(true)
      
      // Check if there's a family update from today
      const hasTodayFamilyUpdate = await checkTodayFamilyUpdate()
      
      if (!hasTodayFamilyUpdate) {
        toast.error("Family visible update required", {
          description: "Please update the family visible section first before saving clinical notes. This ensures all current health data is recorded.",
        })
        setIsSaving(false)
        return
      }

      // Get today's family update to include in clinical note
      const healthRecordRef = doc(db, 'healthRecords', patient.id)
      const healthRecordSnap = await getDoc(healthRecordRef)
      let todayFamilyUpdate = null
      
      if (healthRecordSnap.exists()) {
        const data = healthRecordSnap.data()
        const currentFamilyUpdate = data.currentFamilyVisibleUpdate
        
        if (currentFamilyUpdate) {
          const updateDate = new Date(currentFamilyUpdate.timestamp)
          const today = new Date()
          
          if (updateDate.toDateString() === today.toDateString()) {
            todayFamilyUpdate = currentFamilyUpdate
          }
        }
      }
      
      // Convert custom fields to assessment data
      const customFieldsData: any = {}
      clinicalForm.customFields.forEach(field => {
        if (field.key && field.value) {
          customFieldsData[field.key] = field.value
        }
      })
      
      const clinicalNote: ClinicalNote = {
        id: Date.now().toString(),
        patientId: patient.id,
        assessmentType: clinicalForm.assessmentType,
        assessmentData: {
          ...clinicalForm.assessmentData,
          ...customFieldsData
        },
        timestamp: new Date().toISOString(),
        nurseId: user?.id || "unknown",
        nurseName: user?.name || user?.email || "Unknown Nurse",
        familyVisibleUpdate: todayFamilyUpdate // Include today's family update
      }
      
      // Clean the clinical note object to remove any undefined values
      const cleanClinicalNote = removeUndefinedValues(clinicalNote)

      // Save to separate clinicalNotes collection
      await addDoc(collection(db, 'clinicalNotes'), cleanClinicalNote)

      toast.success("Clinical note saved successfully")
      onUpdate()
    } catch (error) {
      console.error('Error saving clinical note:', error)
      toast.error("Error saving note", {
        description: "Failed to save clinical note. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-[#2E7D32] flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Health Update - {patient.name}
            </h2>
            <p className="text-sm text-muted-foreground">Room {patient.roomNumber} • {patient.guardianName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-[#FAF6E9] border border-[#DDEB9D]">
              <TabsTrigger 
                value="family" 
                className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black"
              >
                <Activity className="h-4 w-4 mr-2" />
                Family Visible Updates
              </TabsTrigger>
              <TabsTrigger 
                value="clinical" 
                className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Clinical Notes Only
              </TabsTrigger>
            </TabsList>

            {/* Family Visible Updates Tab */}
            <TabsContent value="family" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vitals Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#2E7D32] flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    Vital Signs
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Blood Pressure</Label>
                      <Input
                        value={familyForm.vitals.bloodPressure}
                        onChange={(e) => handleVitalsChange("bloodPressure", e.target.value)}
                        placeholder="e.g., 120/80"
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Temperature (°F)</Label>
                      <Input
                        value={familyForm.vitals.temperature}
                        onChange={(e) => handleVitalsChange("temperature", e.target.value)}
                        placeholder="e.g., 98.6"
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Pulse (bpm)</Label>
                      <Input
                        value={familyForm.vitals.pulse}
                        onChange={(e) => handleVitalsChange("pulse", e.target.value)}
                        placeholder="e.g., 72"
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">O2 Saturation (%)</Label>
                      <Input
                        value={familyForm.vitals.oxygenSaturation}
                        onChange={(e) => handleVitalsChange("oxygenSaturation", e.target.value)}
                        placeholder="e.g., 98"
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>
                  </div>
                </div>

                {/* Mood and Appetite Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#2E7D32] flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5" />
                    General Well-being
                  </h3>
                  
                  {/* Mood Scale */}
                  <div className="space-y-3">
                    <Label className="text-[#2E7D32] font-medium">Mood Scale</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {moodOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFamilyForm(prev => ({ ...prev, mood: option.value as 1 | 2 | 3 | 4 | 5 }))}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            familyForm.mood === option.value
                              ? 'border-[#A0C878] bg-[#E8F5E9]'
                              : 'border-gray-200 hover:border-[#DDEB9D]'
                          }`}
                        >
                          <div className="text-2xl mb-1">{option.emoji}</div>
                          <div className="text-xs font-medium">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Appetite */}
                  <div className="space-y-3">
                    <Label className="text-[#2E7D32] font-medium">Appetite</Label>
                    <div className="flex gap-2">
                      {appetiteOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFamilyForm(prev => ({ ...prev, appetite: option.value as "poor" | "fair" | "good" }))}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            familyForm.appetite === option.value
                              ? 'border-[#A0C878] bg-[#E8F5E9]'
                              : 'border-gray-200 hover:border-[#DDEB9D]'
                          }`}
                        >
                          <span className={`font-medium ${option.color}`}>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Participation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#2E7D32] flex items-center gap-2">
                  <ActivityIcon className="h-5 w-5" />
                  Activity Participation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    value={newActivity.activityType}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, activityType: e.target.value }))}
                    placeholder="Activity type"
                    className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  />
                  <Input
                    value={newActivity.duration}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Duration"
                    className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  />
                  <Button onClick={addActivity} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                    Add Activity
                  </Button>
                </div>
                <div className="space-y-2">
                  {familyForm.activityParticipation.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium">{activity.activityType}</span>
                        <span className="text-sm text-muted-foreground ml-2">({activity.duration})</span>
                        {activity.notes && <p className="text-sm text-muted-foreground mt-1">{activity.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medication Compliance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#2E7D32] flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Medication Compliance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    value={newMedication.medicationName}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, medicationName: e.target.value }))}
                    placeholder="Medication name"
                    className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  />
                  <Input
                    value={newMedication.timeGiven}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, timeGiven: e.target.value }))}
                    placeholder="Time given"
                    className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  />
                  <Button onClick={addMedication} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                    Add Medication
                  </Button>
                </div>
                <div className="space-y-2">
                  {familyForm.medicationCompliance.map((medication, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={medication.taken}
                          onCheckedChange={() => toggleMedicationTaken(index)}
                        />
                        <div>
                          <span className="font-medium">{medication.medicationName}</span>
                          <span className="text-sm text-muted-foreground ml-2">({medication.timeGiven})</span>
                          {medication.notes && <p className="text-sm text-muted-foreground mt-1">{medication.notes}</p>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Notes */}
              <div className="space-y-2">
                <Label className="text-[#2E7D32] font-medium">General Notes (Family Visible)</Label>
                <Textarea
                  value={familyForm.generalNotes}
                  onChange={(e) => setFamilyForm(prev => ({ ...prev, generalNotes: e.target.value }))}
                  placeholder="Enter general notes that will be visible to family..."
                  rows={4}
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={saveFamilyUpdate}
                  disabled={isSaving}
                  className="bg-[#A0C878] hover:bg-[#8AB868] text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Family Update"}
                </Button>
              </div>
            </TabsContent>

            {/* Clinical Notes Tab */}
            <TabsContent value="clinical" className="space-y-6">
              {/* Family update status */}
              {hasTodayFamilyUpdate ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Family Update Complete</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Today's family visible update has been completed. You can now save clinical notes.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Family Update Required</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        You must update the Family Visible section first before saving clinical notes. 
                        This ensures all current health data is recorded for today.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <Label className="text-[#2E7D32] font-medium">Assessment Type</Label>
                    <Select 
                      value={clinicalForm.assessmentType} 
                      onValueChange={(value: any) => setClinicalForm(prev => ({ ...prev, assessmentType: value }))}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mental and Physical Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#2E7D32]">Mental & Physical Assessment</h3>
                    
                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Mental Status</Label>
                      <Textarea
                        value={clinicalForm.assessmentData.mentalStatus}
                        onChange={(e) => handleClinicalChange("mentalStatus", e.target.value)}
                        placeholder="Describe mental status, cognition, behavior..."
                        rows={3}
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Physical Status</Label>
                      <Textarea
                        value={clinicalForm.assessmentData.physicalStatus}
                        onChange={(e) => handleClinicalChange("physicalStatus", e.target.value)}
                        placeholder="Describe physical condition, mobility, strength..."
                        rows={3}
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Pain Level (0-10)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={clinicalForm.assessmentData.painLevel}
                          onChange={(e) => handleClinicalChange("painLevel", parseInt(e.target.value) || 0)}
                          className="w-20 border-[#DDEB9D] focus:ring-[#A0C878]"
                        />
                        <Progress value={clinicalForm.assessmentData.painLevel * 10} className="flex-1" />
                      </div>
                    </div>
                  </div>

                  {/* Specialized Assessments */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#2E7D32]">Specialized Assessments</h3>
                    
                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Mobility Assessment</Label>
                      <Textarea
                        value={clinicalForm.assessmentData.mobilityAssessment}
                        onChange={(e) => handleClinicalChange("mobilityAssessment", e.target.value)}
                        placeholder="Assess mobility, gait, balance, transfers..."
                        rows={2}
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Skin Assessment</Label>
                      <Textarea
                        value={clinicalForm.assessmentData.skinAssessment}
                        onChange={(e) => handleClinicalChange("skinAssessment", e.target.value)}
                        placeholder="Skin condition, pressure areas, wounds..."
                        rows={2}
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Nutrition Assessment</Label>
                      <Textarea
                        value={clinicalForm.assessmentData.nutritionAssessment}
                        onChange={(e) => handleClinicalChange("nutritionAssessment", e.target.value)}
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
                      value={clinicalForm.assessmentData.behavioralObservations}
                      onChange={(e) => handleClinicalChange("behavioralObservations", e.target.value)}
                      placeholder="Behavioral changes, mood, social interactions..."
                      rows={3}
                      className="border-[#DDEB9D] focus:ring-[#A0C878]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#2E7D32] font-medium">Care Plan Updates</Label>
                    <Textarea
                      value={clinicalForm.assessmentData.carePlanUpdates}
                      onChange={(e) => handleClinicalChange("carePlanUpdates", e.target.value)}
                      placeholder="Updates to care plan, interventions, goals..."
                      rows={3}
                      className="border-[#DDEB9D] focus:ring-[#A0C878]"
                    />
                  </div>

                  {clinicalForm.assessmentType === "incident" && (
                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Incident Details</Label>
                      <Textarea
                        value={clinicalForm.assessmentData.incidentDetails}
                        onChange={(e) => handleClinicalChange("incidentDetails", e.target.value)}
                        placeholder="Detailed description of incident, circumstances, actions taken..."
                        rows={4}
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>
                  )}

                  {clinicalForm.assessmentType === "medication_review" && (
                    <div className="space-y-2">
                      <Label className="text-[#2E7D32] font-medium">Medication Changes</Label>
                      <Textarea
                        value={clinicalForm.assessmentData.medicationChanges}
                        onChange={(e) => handleClinicalChange("medicationChanges", e.target.value)}
                        placeholder="Medication changes, side effects, effectiveness..."
                        rows={3}
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[#2E7D32] font-medium">Professional Observations</Label>
                    <Textarea
                      value={clinicalForm.assessmentData.professionalObservations}
                      onChange={(e) => handleClinicalChange("professionalObservations", e.target.value)}
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
                    Add additional fields specific to this resident's health needs
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      value={newCustomField.key}
                      onChange={(e) => setNewCustomField(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="Field name (e.g., Blood Sugar)"
                      className="border-[#DDEB9D] focus:ring-[#A0C878]"
                    />
                    <Input
                      value={newCustomField.value}
                      onChange={(e) => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Value"
                      className="border-[#DDEB9D] focus:ring-[#A0C878]"
                    />
                    <Button onClick={addCustomField} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                      Add Field
                    </Button>
                  </div>
                  
                  <Input
                    value={newCustomField.description}
                    onChange={(e) => setNewCustomField(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Field description (optional)"
                    className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  />

                  {/* Display custom fields */}
                  <div className="space-y-2">
                    {clinicalForm.customFields.map((field, index) => (
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
                          onClick={() => removeCustomField(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={saveClinicalNote}
                    disabled={isSaving}
                    className="bg-[#A0C878] hover:bg-[#8AB868] text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Clinical Note"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 