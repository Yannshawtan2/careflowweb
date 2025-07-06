"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, X, Plus, User, Phone, Mail, MapPin, Calendar, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

// User schema for flat user object
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  password: z.string(),
  confirmPassword: z.string(),
  role: z.string().min(2, "Role is required"),
  startDate: z.string().min(1, "Start date is required"),
}).refine((data) => {
  // For updates, password can be empty (keep existing)
  // For creates, password must meet requirements
  if (data.password === "") {
    return true // Allow empty password for updates
  }
  return data.password.length >= 8 &&
         /[A-Z]/.test(data.password) &&
         /[a-z]/.test(data.password) &&
         /[0-9]/.test(data.password)
}, {
  message: "Password must be at least 8 characters with uppercase, lowercase, and number",
  path: ["password"],
}).refine((data) => {
  // If password is provided, confirm password must match
  if (data.password === "") {
    return true // Allow empty password for updates
  }
  return data.password === data.confirmPassword
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

// Use your provided default values
const defaultValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "",
  startDate: "",
}

type FormValues = z.infer<typeof userSchema>

interface CreateUserFormProps {
  initialValues?: Partial<FormValues> & {
    // Patient-specific fields
    dateOfBirth?: string
    roomNumber?: string
    guardianName?: string
    guardianPhone?: string
    emergencyContact?: string
    medicalHistory?: string[]
    allergies?: string[]
    medications?: string[]
    careLevel?: "low" | "medium" | "high"
    status?: "active" | "discharged" | "transferred"
    uid?: string
    id?: string
  }
  mode?: "create" | "update"
  uid?: string | null
  isOpen?: boolean
  onClose?: () => void
  onUserCreated?: () => void
}

export function CreateUserForm({ initialValues, mode = "create", uid, isOpen = false, onClose, onUserCreated }: CreateUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [formKey, setFormKey] = useState(0) // Force re-render when needed
  const [currentRole, setCurrentRole] = useState("") // Track current role separately
  
  // Patient form state
  const [patientData, setPatientData] = useState({
    patientName: "",
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

  // Function to fetch patient data for a guardian
  const fetchPatientDataForGuardian = async (guardianId: string) => {
    try {
      console.log('Fetching patient data for guardian:', guardianId)
      
      // Query patients collection to find patient linked to this guardian
      const patientsSnapshot = await getDocs(
        query(collection(db, 'patients'), where('guardianId', '==', guardianId))
      )
      
      if (!patientsSnapshot.empty) {
        const patientDoc = patientsSnapshot.docs[0]
        const patientData = patientDoc.data()
        
        console.log('Found patient data:', patientData)
        
        // Populate patient form data
        setPatientData({
          patientName: patientData.name || "",
          dateOfBirth: patientData.dateOfBirth || "",
          roomNumber: patientData.roomNumber || "",
          guardianName: patientData.guardianName || "",
          guardianPhone: patientData.guardianPhone || "",
          emergencyContact: patientData.emergencyContact || "",
          medicalHistory: patientData.medicalHistory || [],
          allergies: patientData.allergies || [],
          medications: patientData.medications || [],
          careLevel: patientData.careLevel || "medium",
          status: patientData.status || "active"
        })
      } else {
        console.log('No patient found for guardian:', guardianId)
      }
    } catch (error) {
      console.error('Error fetching patient data for guardian:', error)
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: defaultValues, // Always use defaultValues for initialization
    mode: "onChange",
  })

  useEffect(() => {
    if (initialValues) {
      console.log('Setting initial values:', initialValues)
      console.log('Role from initial values:', initialValues.role)
      
      // Set form values directly instead of using reset
      form.setValue('name', initialValues.name || '')
      form.setValue('email', initialValues.email || '')
      form.setValue('phone', initialValues.phone || '')
      form.setValue('role', initialValues.role || '')
      form.setValue('startDate', initialValues.startDate || '')
      form.setValue('password', '')
      form.setValue('confirmPassword', '')
      
      // Set current role state
      setCurrentRole(initialValues.role || '')
      
      console.log('Form values set, role should be:', initialValues.role)
      setFormKey(prev => prev + 1) // Force re-render
      
      // If editing a patient, populate patient data
      if (initialValues.role === "patient") {
        setPatientData({
          patientName: initialValues.name || "",
          dateOfBirth: initialValues.dateOfBirth || "",
          roomNumber: initialValues.roomNumber || "",
          guardianName: initialValues.guardianName || "",
          guardianPhone: initialValues.guardianPhone || "",
          emergencyContact: initialValues.emergencyContact || "",
          medicalHistory: initialValues.medicalHistory || [],
          allergies: initialValues.allergies || [],
          medications: initialValues.medications || [],
          careLevel: initialValues.careLevel || "medium",
          status: initialValues.status || "active"
        })
        setShowPatientForm(true)
      } else if (initialValues.role === "guardian") {
        // For guardians, fetch and populate patient data
        setShowPatientForm(true)
        const guardianId = initialValues.uid || initialValues.id
        if (guardianId) {
          fetchPatientDataForGuardian(guardianId)
        }
      }
    } else {
      // If no initial values, reset the form
      resetForm()
    }
  }, [initialValues])

  // Watch for role changes to show/hide patient form
  const selectedRole = currentRole || form.watch("role")
  useEffect(() => {
    console.log('Selected role changed to:', selectedRole)
    console.log('Form values:', form.getValues())
    console.log('Current role state:', currentRole)
    setShowPatientForm(selectedRole === "guardian" || selectedRole === "patient")
  }, [selectedRole, currentRole])

  // Reset function to clear all form data
  const resetForm = () => {
    form.reset(defaultValues)
    setCurrentRole("")
    setPatientData({
      patientName: "",
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
    setNewMedicalHistory("")
    setNewAllergy("")
    setNewMedication("")
    setShowPatientForm(false)
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  // Reset form when creating a new user (no initial values)
  useEffect(() => {
    if (isOpen && !initialValues && mode === "create") {
      resetForm()
    }
  }, [isOpen, initialValues, mode])

  // Patient form handlers
  const handlePatientInputChange = (field: string, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }))
  }

  const addMedicalHistory = () => {
    if (newMedicalHistory.trim()) {
      setPatientData(prev => ({
        ...prev,
        medicalHistory: [...prev.medicalHistory, newMedicalHistory.trim()]
      }))
      setNewMedicalHistory("")
    }
  }

  const removeMedicalHistory = (index: number) => {
    setPatientData(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter((_, i) => i !== index)
    }))
  }

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setPatientData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }))
      setNewAllergy("")
    }
  }

  const removeAllergy = (index: number) => {
    setPatientData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }))
  }

  const addMedication = () => {
    if (newMedication.trim()) {
      setPatientData(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()]
      }))
      setNewMedication("")
    }
  }

  const removeMedication = (index: number) => {
    setPatientData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    try {
      console.log('Form submission - Mode:', mode, 'UID:', uid, 'Data:', data)
      
      // Validate password for new users
      if (mode === "create" && (!data.password || data.password.trim() === "")) {
        toast.error("Password is required", {
          description: "Please enter a password for the new user.",
        })
        setIsSubmitting(false)
        return
      }
      
      // Validate patient data if creating a guardian or updating a patient
      if ((data.role === "guardian" || data.role === "patient") && showPatientForm) {
        const requiredFields = data.role === "guardian" 
          ? (!patientData.patientName || !patientData.dateOfBirth || !patientData.roomNumber)
          : (!patientData.dateOfBirth || !patientData.roomNumber)
        
        if (requiredFields) {
          toast.error("Please fill in all required patient fields", {
            description: data.role === "guardian" 
              ? "Patient name, date of birth, and room number are required."
              : "Date of birth and room number are required.",
          })
          setIsSubmitting(false)
          return
        }
      }

      let res, result
      
      if (mode === "update" && uid) {
        console.log('Processing UPDATE request')
        // For updates, remove password fields if they're empty (keep existing password)
        const { password, confirmPassword, ...updateDataWithoutPassword } = data
        
        // Only include password if it's provided and not empty
        const updateData = {
          ...updateDataWithoutPassword,
          ...(password && password.trim() !== '' && { password }) // Only include password if it's not empty
        }
        
        // For patient updates, include patient-specific data
        // For guardian updates, also include patient data to update the associated patient
        const finalUpdateData = (data.role === "patient" || data.role === "guardian") ? {
          ...updateData,
          dateOfBirth: patientData.dateOfBirth,
          roomNumber: patientData.roomNumber,
          guardianName: patientData.guardianName,
          guardianPhone: patientData.guardianPhone,
          emergencyContact: patientData.emergencyContact,
          medicalHistory: patientData.medicalHistory,
          allergies: patientData.allergies,
          medications: patientData.medications,
          careLevel: patientData.careLevel,
          status: patientData.status
        } : updateData
        
        console.log('Sending UPDATE request with data:', finalUpdateData)
        res = await fetch(`/api/users?uid=${uid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalUpdateData),
        })
        result = await res.json()
        if (result.success) {
          toast("User updated successfully", {
            description: `${data.name} has been updated as a ${data.role}`,
          })
          resetForm()
          onClose?.()
        } else {
          toast.error("Error updating user", {
            description: result.error || "There was a problem updating the user. Please try again.",
          })
        }
      } else {
        console.log('Processing CREATE request - Mode:', mode, 'UID:', uid)
        // Create user
        res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        result = await res.json();
        
        if (result.success) {
          // If creating a guardian, also create the patient record
          if (data.role === "guardian" && showPatientForm) {
            try {
              console.log('Creating patient record for guardian:', result.uid)
              console.log('Patient data:', patientData)
              
              // Create patient record directly in Firestore (not as a user)
              const patientRecord = {
                name: patientData.patientName,
                dateOfBirth: patientData.dateOfBirth,
                roomNumber: patientData.roomNumber,
                guardianId: result.uid, // Link to the guardian user
                guardianName: data.name, // Use the guardian's name
                guardianPhone: data.phone, // Use the guardian's phone
                emergencyContact: patientData.emergencyContact,
                medicalHistory: patientData.medicalHistory,
                allergies: patientData.allergies,
                medications: patientData.medications,
                careLevel: patientData.careLevel,
                admissionDate: new Date().toISOString(),
                status: patientData.status,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
              
              console.log('Patient record to create:', patientRecord)
              
              // Create patient record directly in Firestore using the patients collection
              const patientRes = await fetch('/api/guardians', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  guardianId: result.uid,
                  patientData: patientRecord
                }),
              });
              
              const patientResult = await patientRes.json();
              if (patientResult.success) {
                console.log('Patient created with ID:', patientResult.patientId)
                toast.success("Guardian and patient created successfully")
              } else {
                throw new Error(patientResult.error || 'Failed to create patient')
              }
            } catch (patientError) {
              console.error('Error creating patient record:', patientError)
              toast.error("Guardian created but failed to create patient record", {
                description: "Please contact support to add the patient information.",
              })
            }
          } else if (data.role === "patient" && showPatientForm) {
            // If creating a patient directly, include patient data in the user record
            toast.success("Patient created successfully")
          } else {
            toast('User created successfully', {
              description: `${data.name} has been added as a ${data.role}`,
            });
          }
          
          resetForm()
          onUserCreated?.()
          onClose?.()
        } else {
          toast.error('Error creating user', {
            description: result.error || 'There was a problem creating the user. Please try again.',
          });
        }
      }
    } catch (error: any) {
      toast.error(mode === "update" ? 'Error updating user' : 'Error creating user', {
        description: error.message || 'There was a problem. Please try again.',
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-[#2E7D32] flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {uid ? "Update User" : "Create New User"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic User Information */}
            <div className="space-y-4">
              <div className="rounded-md bg-[#DDEB9D]/30 p-4">
                <h2 className="mb-4 text-lg font-medium">Basic Information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                      <FormLabel>Select User Type</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value)
                          setCurrentRole(value)
                        }}
                        value={currentRole || field.value || ''}
                        key={`role-${formKey}-${currentRole || 'empty'}`} // Force re-render when value changes
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]">
                            <SelectValue placeholder="Select user type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="name@example.com" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(123) 456-7890" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={date => field.onChange(date ? date.toISOString() : "")}
                              disabled={(date: Date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

                        <div className="rounded-md bg-[#DDEB9D]/30 p-4">
            <h2 className="mb-4 text-lg font-medium">Security</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {mode === "update" ? "New Password (leave blank to keep current)" : "Password"}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={mode === "update" ? "Leave blank to keep current" : "••••••••"} 
                        {...field} 
                        className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" 
                      />
                    </FormControl>
                    <FormMessage />
                    {mode === "update" && (
                      <FormDescription>
                        Leave password fields empty to keep the current password unchanged.
                      </FormDescription>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {mode === "update" ? "Confirm New Password" : "Confirm Password"}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={mode === "update" ? "Confirm new password" : "••••••••"} 
                        {...field} 
                        className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
            </div>

            {/* Patient Information Section - Show when guardian or patient is selected */}
            {showPatientForm && (
              <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                <h2 className="mb-4 text-lg font-medium text-[#2E7D32] flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedRole === "guardian" ? "Patient Information" : "Patient Details"}
                </h2>
                
                {/* Basic Patient Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {selectedRole === "guardian" ? (
                    <div className="space-y-2">
                      <Label htmlFor="patientName" className="text-[#2E7D32] font-medium">
                        Patient Name *
                      </Label>
                      <Input
                        id="patientName"
                        value={patientData.patientName}
                        onChange={(e) => handlePatientInputChange("patientName", e.target.value)}
                        placeholder="Enter patient name"
                        className="border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </div>
                  ) : null}
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-[#2E7D32] font-medium">
                      Date of Birth *
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={patientData.dateOfBirth}
                      onChange={(e) => handlePatientInputChange("dateOfBirth", e.target.value)}
                      className="border-[#DDEB9D] focus:ring-[#A0C878]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomNumber" className="text-[#2E7D32] font-medium">
                      Room Number *
                    </Label>
                    <Input
                      id="roomNumber"
                      value={patientData.roomNumber}
                      onChange={(e) => handlePatientInputChange("roomNumber", e.target.value)}
                      placeholder="e.g., 101A"
                      className="border-[#DDEB9D] focus:ring-[#A0C878]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="careLevel" className="text-[#2E7D32] font-medium">
                      Care Level
                    </Label>
                    <Select value={patientData.careLevel} onValueChange={(value: "low" | "medium" | "high") => handlePatientInputChange("careLevel", value)}>
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

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-[#2E7D32] flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
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
                      {patientData.medicalHistory.map((item, index) => (
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
                  <div className="space-y-3">
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
                      {patientData.allergies.map((item, index) => (
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
                  <div className="space-y-3">
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
                      {patientData.medications.map((item, index) => (
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
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[#DDEB9D] bg-white hover:bg-[#DDEB9D] hover:text-black"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "update" ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  mode === "update" ? "Update User" : "Create User"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
