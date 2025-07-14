export interface InventoryItem {
    id: string
    name: string
    type: "food" | "medical"
    quantity: number
    minimumQuantity: number
    expiryDate: string
    unit: string
    location: string
  }
  
  export interface BillingSubscription {
    id: string
    guardianId: string
    guardianName: string
    amount: number
    frequency: "monthly" | "quarterly" | "yearly"
    status: "active" | "paused" | "cancelled" | "cancel_at_period_end" | "incomplete"
    nextPaymentDate: string
    description: string
    createdAt: string
    cancelAt?: string
  }
  
  export interface BillingTransaction {
    id: string
    subscriptionId: string
    guardianName: string
    amount: number
    status: "completed" | "failed" | "pending"
    date: string
    paymentMethod: string
    failureReason?: string
  }
  
  export interface Guardian {
    id: string
    name: string
    email: string
    phone: string
    status: "active" | "inactive"
  }

  // New types for patient health data management
  export interface Patient {
    id: string
    name: string
    dateOfBirth: string
    roomNumber: string
    guardianId: string
    guardianName: string
    guardianPhone: string
    emergencyContact: string
    medicalHistory: string[]
    allergies: string[]
    medications: string[]
    careLevel: "low" | "medium" | "high"
    admissionDate: string
    status: "active" | "discharged" | "transferred"
    createdAt: string
    updatedAt: string
  }

  export interface Vitals {
    bloodPressure: string
    temperature: string
    pulse: string
    oxygenSaturation?: string
    weight?: string
    height?: string
  }

  export interface MoodScale {
    value: 1 | 2 | 3 | 4 | 5
    description: "Very Poor" | "Poor" | "Fair" | "Good" | "Excellent"
  }

  export interface AppetiteLevel {
    value: "poor" | "fair" | "good"
    description: string
  }

  export interface ActivityParticipation {
    participated: boolean
    activityType: string
    duration: string
    notes?: string
  }

  export interface MedicationCompliance {
    medicationName: string
    taken: boolean
    timeGiven: string
    notes?: string
  }

  export interface FamilyVisibleUpdate {
    id: string
    patientId: string
    vitals: Vitals
    mood: MoodScale
    appetite: AppetiteLevel
    activityParticipation: ActivityParticipation[]
    medicationCompliance: MedicationCompliance[]
    generalNotes: string
    timestamp: string
    nurseId: string
    nurseName: string
  }

  export interface ClinicalNote {
    id: string
    patientId: string
    assessmentType: "daily" | "weekly" | "incident" | "care_plan" | "medication_review"
    assessmentData: {
      mentalStatus?: string
      physicalStatus?: string
      painLevel?: number
      mobilityAssessment?: string
      skinAssessment?: string
      nutritionAssessment?: string
      behavioralObservations?: string
      carePlanUpdates?: string
      incidentDetails?: string
      medicationChanges?: string
      professionalObservations?: string
      [key: string]: any // Allow custom fields
    }
    timestamp: string
    nurseId: string
    nurseName: string
    familyVisibleUpdate?: FamilyVisibleUpdate // Include today's family update
  }

  export interface HealthRecord {
    id: string
    patientId: string
    currentFamilyVisibleUpdate?: FamilyVisibleUpdate // Single current state instead of array
    lastUpdated: string
  }

  export interface Nurse {
    id: string
    name: string
    email: string
    phone: string
    licenseNumber: string
    specialization: string[]
    status: "active" | "inactive"
  }

export interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  imageUrl?: string;
  createdAt: string;
  active: boolean;
}

export interface Donation {
  id: string;
  campaignId: string;
  amount: number;
  donorEmail?: string;
  createdAt: string;
  stripeSessionId: string;
}
