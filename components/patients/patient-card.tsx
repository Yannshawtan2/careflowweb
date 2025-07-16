"use client"

import { useState } from "react"
import { Heart, Phone, AlertTriangle, Activity, Calendar, User, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Patient, Vitals, MoodScale } from "@/lib/types"
import { toast } from "sonner";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface PatientCardProps {
  patient: Patient
  healthSummary: {
    lastFamilyUpdate?: string
    lastClinicalNote?: string
    mood?: MoodScale
    vitals?: Vitals
  } | null
  onHealthUpdate: () => void
  getCareLevelColor: (careLevel: string) => string
  getStatusColor: (status: string) => string
}

export function PatientCard({
  patient,
  healthSummary,
  onHealthUpdate,
  getCareLevelColor,
  getStatusColor
}: PatientCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)

  // Debug logging
  console.log('PatientCard received patient:', patient)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMoodColor = (moodValue?: number) => {
    if (!moodValue) return "text-gray-400"
    switch (moodValue) {
      case 1: return "text-red-500"
      case 2: return "text-orange-500"
      case 3: return "text-yellow-500"
      case 4: return "text-blue-500"
      case 5: return "text-green-500"
      default: return "text-gray-400"
    }
  }

  const getMoodIcon = (moodValue?: number) => {
    if (!moodValue) return "😐"
    switch (moodValue) {
      case 1: return "😢"
      case 2: return "😕"
      case 3: return "😐"
      case 4: return "🙂"
      case 5: return "😊"
      default: return "😐"
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const handleEmergencyContact = async () => {
    try {
      
      const requestData = {
        guardianId: patient.guardianId,
        patientName: patient.name,
        patientId: patient.id,
      };
      
      const res = await fetch('/api/notify-guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      console.log('Emergency API response status:', res.status);
      
      if (res.ok) {
        const responseData = await res.json();
        
        toast.success('Emergency alert sent to guardian!');
      } else {
        const data = await res.json();
        
        toast.error(data.error || 'Failed to send emergency alert.');
      }
    } catch (err) {
      console.error('Error in handleEmergencyContact:', err);
      toast.error('Failed to send emergency alert.');
    }
  };

  return (
    <>
      <Card 
        className={`bg-[#FAF6E9] border-[#DDEB9D] transition-all duration-200 hover:shadow-lg ${
          isHovered ? 'ring-2 ring-[#A0C878]' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-[#2E7D32] flex items-center gap-2">
                <Heart className="h-5 w-5" />
                {patient.name || 'N/A'}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{calculateAge(patient.dateOfBirth || '')} years old</span>
                <span>•</span>
                <MapPin className="h-4 w-4" />
                <span>Room {patient.roomNumber || 'N/A'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className={getCareLevelColor(patient.careLevel || 'medium')}>
                {(patient.careLevel || 'medium').charAt(0).toUpperCase() + (patient.careLevel || 'medium').slice(1)} Care
              </Badge>
              <Badge className={getStatusColor(patient.status || 'active')}>
                {(patient.status || 'active').charAt(0).toUpperCase() + (patient.status || 'active').slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Guardian Info */}
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#2E7D32]">Guardian</p>
                <p className="text-sm text-muted-foreground">{patient.guardianName || 'N/A'}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEmergencyConfirm(true)}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Phone className="h-4 w-4 mr-1" />
                Emergency
              </Button>
            </div>
          </div>

          {/* Health Summary */}
          {healthSummary && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[#2E7D32]">Latest Health Update</h4>
                {healthSummary.lastFamilyUpdate && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(healthSummary.lastFamilyUpdate)}
                  </span>
                )}
              </div>

              {/* Vitals */}
              {healthSummary.vitals && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/50 rounded p-2 text-center">
                    <p className="font-medium text-[#2E7D32]">BP</p>
                    <p className="text-muted-foreground">{healthSummary.vitals.bloodPressure}</p>
                  </div>
                  <div className="bg-white/50 rounded p-2 text-center">
                    <p className="font-medium text-[#2E7D32]">Temp</p>
                    <p className="text-muted-foreground">{healthSummary.vitals.temperature}°F</p>
                  </div>
                  <div className="bg-white/50 rounded p-2 text-center">
                    <p className="font-medium text-[#2E7D32]">Pulse</p>
                    <p className="text-muted-foreground">{healthSummary.vitals.pulse} bpm</p>
                  </div>
                </div>
              )}

              {/* Mood */}
              {healthSummary.mood && (
                <div className="flex items-center justify-between bg-white/50 rounded p-2">
                  <span className="text-sm font-medium text-[#2E7D32]">Mood</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMoodIcon(healthSummary.mood.value)}</span>
                    <span className={`text-sm font-medium ${getMoodColor(healthSummary.mood.value)}`}>
                      {healthSummary.mood.description}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medications */}
          {patient.medications && patient.medications.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Medications</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {patient.medications.slice(0, 3).map((med, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-amber-100 border-amber-300 text-amber-800">
                    {med}
                  </Badge>
                ))}
                {patient.medications.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300 text-amber-800">
                    +{patient.medications.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Allergies */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Allergies</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {patient.allergies.slice(0, 2).map((allergy, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-red-100 border-red-300 text-red-800">
                    {allergy}
                  </Badge>
                ))}
                {patient.allergies.length > 2 && (
                  <Badge variant="outline" className="text-xs bg-red-100 border-red-300 text-red-800">
                    +{patient.allergies.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onHealthUpdate}
              className="flex-1 bg-[#A0C878] hover:bg-[#8AB868] text-white"
            >
              <Activity className="h-4 w-4 mr-2" />
              Update Health
            </Button>
          </div>

          {/* Last Update Info */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-[#DDEB9D]">
            {healthSummary?.lastFamilyUpdate ? (
              <span>Last updated: {formatDate(healthSummary.lastFamilyUpdate)}</span>
            ) : (
              <span>No health updates yet</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Confirmation Dialog */}
      <Dialog open={showEmergencyConfirm} onOpenChange={setShowEmergencyConfirm}>
        <DialogContent>
          <DialogTitle>Send Emergency Alert?</DialogTitle>
          <div>
            Are you sure you want to send an emergency alert to the guardian for <b>{patient.name}</b>?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmergencyConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowEmergencyConfirm(false);
                handleEmergencyContact();
              }}
            >
              Yes, Send Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

} 