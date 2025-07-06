"use client"

import { useState } from "react"
import { X, Phone, MessageSquare, AlertTriangle, Clock, User, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Patient } from "@/lib/types"
import { toast } from "sonner"

interface EmergencyContactModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient
}

export function EmergencyContactModal({ isOpen, onClose, patient }: EmergencyContactModalProps) {
  const [contactMethod, setContactMethod] = useState<"phone" | "sms" | "email">("phone")
  const [message, setMessage] = useState("")
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [isContacting, setIsContacting] = useState(false)

  const urgencyOptions = [
    { value: "low", label: "Low Priority", color: "text-green-600", bgColor: "bg-green-100", borderColor: "border-green-300" },
    { value: "medium", label: "Medium Priority", color: "text-yellow-600", bgColor: "bg-yellow-100", borderColor: "border-yellow-300" },
    { value: "high", label: "High Priority", color: "text-orange-600", bgColor: "bg-orange-100", borderColor: "border-orange-300" },
    { value: "critical", label: "Critical Emergency", color: "text-red-600", bgColor: "bg-red-100", borderColor: "border-red-300" }
  ]

  const getDefaultMessage = () => {
    const baseMessage = `URGENT: Regarding ${patient.name} (Room ${patient.roomNumber})`
    
    switch (urgency) {
      case "low":
        return `${baseMessage}\n\nThis is a low priority update. Please contact us when convenient.`
      case "medium":
        return `${baseMessage}\n\nWe need to discuss some important matters regarding care. Please contact us soon.`
      case "high":
        return `${baseMessage}\n\nURGENT: We need immediate attention regarding care decisions. Please call immediately.`
      case "critical":
        return `${baseMessage}\n\nCRITICAL EMERGENCY: Immediate action required. Please call 911 or come to facility immediately.`
      default:
        return baseMessage
    }
  }

  const handleUrgencyChange = (value: "low" | "medium" | "high" | "critical") => {
    setUrgency(value)
    if (!message || message === getDefaultMessage()) {
      setMessage(getDefaultMessage())
    }
  }

  const handleContact = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    try {
      setIsContacting(true)
      
      const response = await fetch('/api/emergency-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patient.id,
          patientName: patient.name,
          guardianName: patient.guardianName,
          guardianPhone: patient.guardianPhone,
          contactMethod,
          urgency,
          message
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success(`Emergency contact sent to ${patient.guardianPhone}`, {
          description: `Message sent via ${contactMethod.toUpperCase()}`,
        })
        onClose()
      } else {
        throw new Error(result.error || 'Failed to send contact')
      }
    } catch (error) {
      console.error('Error sending emergency contact:', error)
      toast.error("Failed to send emergency contact", {
        description: "Please try again or contact manually.",
      })
    } finally {
      setIsContacting(false)
    }
  }

  const getContactIcon = () => {
    switch (contactMethod) {
      case "phone": return <Phone className="h-5 w-5" />
      case "sms": return <MessageSquare className="h-5 w-5" />
      case "email": return <Mail className="h-5 w-5" />
      default: return <Phone className="h-5 w-5" />
    }
  }

  const getContactLabel = () => {
    switch (contactMethod) {
      case "phone": return "Call Guardian"
      case "sms": return "Send SMS"
      case "email": return "Send Email"
      default: return "Contact"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#2E7D32]">Emergency Contact</h2>
              <p className="text-sm text-muted-foreground">Contact guardian for {patient.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Information */}
          <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-[#2E7D32]">Patient Name</Label>
                  <p className="text-sm">{patient.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#2E7D32]">Room Number</Label>
                  <p className="text-sm">{patient.roomNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#2E7D32]">Guardian Name</Label>
                  <p className="text-sm">{patient.guardianName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#2E7D32]">Guardian Phone</Label>
                  <p className="text-sm">{patient.guardianPhone}</p>
                </div>
              </div>
              {patient.emergencyContact && (
                <div>
                  <Label className="text-sm font-medium text-[#2E7D32]">Emergency Contact</Label>
                  <p className="text-sm">{patient.emergencyContact}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Method Selection */}
          <div className="space-y-3">
            <Label className="text-[#2E7D32] font-medium">Contact Method</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setContactMethod("phone")}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  contactMethod === "phone"
                    ? 'border-[#A0C878] bg-[#E8F5E9]'
                    : 'border-gray-200 hover:border-[#DDEB9D]'
                }`}
              >
                <Phone className="h-6 w-6 text-[#2E7D32]" />
                <span className="text-sm font-medium">Phone Call</span>
              </button>
              <button
                type="button"
                onClick={() => setContactMethod("sms")}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  contactMethod === "sms"
                    ? 'border-[#A0C878] bg-[#E8F5E9]'
                    : 'border-gray-200 hover:border-[#DDEB9D]'
                }`}
              >
                <MessageSquare className="h-6 w-6 text-[#2E7D32]" />
                <span className="text-sm font-medium">SMS</span>
              </button>
              <button
                type="button"
                onClick={() => setContactMethod("email")}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  contactMethod === "email"
                    ? 'border-[#A0C878] bg-[#E8F5E9]'
                    : 'border-gray-200 hover:border-[#DDEB9D]'
                }`}
              >
                <Mail className="h-6 w-6 text-[#2E7D32]" />
                <span className="text-sm font-medium">Email</span>
              </button>
            </div>
          </div>

          {/* Urgency Level */}
          <div className="space-y-3">
            <Label className="text-[#2E7D32] font-medium">Urgency Level</Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {urgencyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleUrgencyChange(option.value as any)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    urgency === option.value
                      ? `${option.borderColor} ${option.bgColor}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`font-medium ${option.color}`}>{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <Label className="text-[#2E7D32] font-medium">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your emergency message..."
              rows={6}
              className="border-[#DDEB9D] focus:ring-[#A0C878]"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>This message will be sent to the guardian</span>
              <span>{message.length} characters</span>
            </div>
          </div>

          {/* Quick Message Templates */}
          <div className="space-y-3">
            <Label className="text-[#2E7D32] font-medium">Quick Templates</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage(`URGENT: ${patient.name} (Room ${patient.roomNumber}) needs immediate attention. Please call us right away.`)}
                className="text-left justify-start border-[#DDEB9D] hover:bg-[#E8F5E9]"
              >
                Immediate Attention Needed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage(`${patient.name} (Room ${patient.roomNumber}) has a medical concern that requires your input. Please contact us.`)}
                className="text-left justify-start border-[#DDEB9D] hover:bg-[#E8F5E9]"
              >
                Medical Concern
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage(`Regarding ${patient.name} (Room ${patient.roomNumber}): We need your consent for a medical procedure. Please call immediately.`)}
                className="text-left justify-start border-[#DDEB9D] hover:bg-[#E8F5E9]"
              >
                Consent Required
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage(`EMERGENCY: ${patient.name} (Room ${patient.roomNumber}) is being transported to hospital. Please meet us there or call immediately.`)}
                className="text-left justify-start border-[#DDEB9D] hover:bg-[#E8F5E9]"
              >
                Hospital Transport
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleContact}
              disabled={isContacting}
              className={`${
                urgency === "critical" 
                  ? "bg-red-600 hover:bg-red-700" 
                  : urgency === "high"
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-[#A0C878] hover:bg-[#8AB868]"
              } text-white`}
            >
              {getContactIcon()}
              <span className="ml-2">
                {isContacting ? "Contacting..." : getContactLabel()}
              </span>
            </Button>
          </div>

          {/* Warning for Critical Emergencies */}
          {urgency === "critical" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Critical Emergency</span>
              </div>
              <p className="text-sm text-red-700 mt-2">
                For critical emergencies, also consider calling 911 or emergency services directly.
                This system will attempt to contact the guardian, but immediate medical attention may be required.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 