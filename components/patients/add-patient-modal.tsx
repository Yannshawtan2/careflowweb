"use client"

import { useState } from "react"
import { X, Plus, User, Phone, Mail, MapPin, Calendar, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Patient } from "@/lib/types"
import { toast } from "sonner"

interface AddPatientModalProps {
  isOpen: boolean
  onClose: () => void
  onPatientAdded: () => void
}

export function AddPatientModal({ isOpen, onClose, onPatientAdded }: AddPatientModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    roomNumber: "",
    guardianName: "",
    guardianPhone: "",
    emergencyContact: "",
    medicalHistory: [] as string[],
    allergies: [] as string[],
    medications: [] as string[],
    careLevel: "medium" as "low" | "medium" | "high",
    status: "active" as "active" | "discharged" | "transferred"
  })
  const [newMedicalHistory, setNewMedicalHistory] = useState("")
  const [newAllergy, setNewAllergy] = useState("")
  const [newMedication, setNewMedication] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addMedicalHistory = () => {
    if (newMedicalHistory.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalHistory: [...prev.medicalHistory, newMedicalHistory.trim()]
      }))
      setNewMedicalHistory("")
    }
  }

  const removeMedicalHistory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter((_, i) => i !== index)
    }))
  }

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }))
      setNewAllergy("")
    }
  }

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }))
  }

  const addMedication = () => {
    if (newMedication.trim()) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()]
      }))
      setNewMedication("")
    }
  }

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.dateOfBirth || !formData.roomNumber || 
        !formData.guardianName || !formData.guardianPhone) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setIsLoading(true)
      
      const patientData = {
        ...formData,
        admissionDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await addDoc(collection(db, 'patients'), patientData)
      
      toast.success("Patient added successfully")
      onPatientAdded()
      onClose()
      
      // Reset form
      setFormData({
        name: "",
        dateOfBirth: "",
        roomNumber: "",
        guardianName: "",
        guardianPhone: "",
        emergencyContact: "",
        medicalHistory: [],
        allergies: [],
        medications: [],
        careLevel: "medium",
        status: "active"
      })
    } catch (error) {
      console.error('Error adding patient:', error)
      toast.error("Error adding patient", {
        description: "Failed to add patient. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-[#2E7D32] flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Patient
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#2E7D32] font-medium">
                Patient Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter patient name"
                className="border-[#DDEB9D] focus:ring-[#A0C878]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-[#2E7D32] font-medium">
                Date of Birth *
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                className="border-[#DDEB9D] focus:ring-[#A0C878]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomNumber" className="text-[#2E7D32] font-medium">
                Room Number *
              </Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                placeholder="e.g., 101A"
                className="border-[#DDEB9D] focus:ring-[#A0C878]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="careLevel" className="text-[#2E7D32] font-medium">
                Care Level
              </Label>
              <Select value={formData.careLevel} onValueChange={(value: "low" | "medium" | "high") => handleInputChange("careLevel", value)}>
                <SelectTrigger className="border-[#DDEB9D] focus:ring-[#A0C878]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Care</SelectItem>
                  <SelectItem value="medium">Medium Care</SelectItem>
                  <SelectItem value="high">High Care</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#2E7D32] mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardianName" className="text-[#2E7D32] font-medium">
                  Guardian Name *
                </Label>
                <Input
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={(e) => handleInputChange("guardianName", e.target.value)}
                  placeholder="Enter guardian name"
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guardianPhone" className="text-[#2E7D32] font-medium">
                  Guardian Phone *
                </Label>
                <Input
                  id="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={(e) => handleInputChange("guardianPhone", e.target.value)}
                  placeholder="Enter phone number"
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="text-[#2E7D32] font-medium">
                  Emergency Contact
                </Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                  placeholder="Enter emergency contact"
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#2E7D32] mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Medical Information
            </h3>
            
            {/* Medical History */}
            <div className="space-y-3">
              <Label className="text-[#2E7D32] font-medium">Medical History</Label>
              <div className="flex gap-2">
                <Input
                  value={newMedicalHistory}
                  onChange={(e) => setNewMedicalHistory(e.target.value)}
                  placeholder="Add medical condition"
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedicalHistory())}
                />
                <Button type="button" onClick={addMedicalHistory} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.medicalHistory.map((item, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-100 border-blue-300 text-blue-800">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeMedicalHistory(index)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-3 mt-4">
              <Label className="text-[#2E7D32] font-medium">Allergies</Label>
              <div className="flex gap-2">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy"
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                />
                <Button type="button" onClick={addAllergy} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((item, index) => (
                  <Badge key={index} variant="outline" className="bg-red-100 border-red-300 text-red-800">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeAllergy(index)}
                      className="ml-1 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Medications */}
            <div className="space-y-3 mt-4">
              <Label className="text-[#2E7D32] font-medium">Current Medications</Label>
              <div className="flex gap-2">
                <Input
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="Add medication"
                  className="border-[#DDEB9D] focus:ring-[#A0C878]"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                />
                <Button type="button" onClick={addMedication} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.medications.map((item, index) => (
                  <Badge key={index} variant="outline" className="bg-amber-100 border-amber-300 text-amber-800">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="ml-1 text-amber-600 hover:text-amber-800"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
              {isLoading ? "Adding..." : "Add Patient"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 