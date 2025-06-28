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
    status: "active" | "paused" | "cancelled"
    nextPaymentDate: string
    description: string
    createdAt: string
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
