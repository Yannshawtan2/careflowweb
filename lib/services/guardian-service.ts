// app/api/guardians/route.ts
import { adminDb } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

// lib/services/guardian-service.ts
export interface Guardian {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  uid: string
  createdAt: string
  updatedAt: string
  startDate?: string
  permissions?: any[]
  stripeCustomerId?: string // Keep this for billing integration
}

export const guardianService = {
  // Get all guardians (filtering by role)
  async getGuardians(): Promise<Guardian[]> {
    try {
      const response = await fetch('/api/guardians')
      
      if (!response.ok) {
        throw new Error('Failed to fetch guardians')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching guardians:', error)
      throw error
    }
  },

  // Get a single guardian by ID
  async getGuardianById(id: string): Promise<Guardian> {
    try {
      const response = await fetch(`/api/guardians/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Guardian not found')
        }
        throw new Error('Failed to fetch guardian')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching guardian:', error)
      throw error
    }
  }
}