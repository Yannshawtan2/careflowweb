"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Guardian {
  uid: string
  name: string
  email: string
  hasFcmToken: boolean
  fcmTokenPreview: string
  lastTokenUpdate?: any
}

export default function DebugGuardiansPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(false)

  const fetchGuardians = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notify-guardian')
      const data = await res.json()
      
      if (data.success) {
        setGuardians(data.guardians)
        toast.success(`Found ${data.totalGuardians} guardians, ${data.guardiansWithTokens} with FCM tokens`)
      } else {
        toast.error('Failed to fetch guardians')
      }
    } catch (error) {
      console.error('Error fetching guardians:', error)
      toast.error('Error fetching guardians')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuardians()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#A0C878]">Debug Guardians</h1>
          <p className="text-muted-foreground">Check all guardians and their FCM tokens</p>
        </div>
        <Button onClick={fetchGuardians} disabled={loading} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {guardians.map((guardian) => (
          <Card key={guardian.uid} className="bg-[#FAF6E9] border-[#DDEB9D]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{guardian.name}</span>
                <Badge className={guardian.hasFcmToken ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {guardian.hasFcmToken ? "Has Token" : "No Token"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>UID:</strong> {guardian.uid}</p>
              <p><strong>Email:</strong> {guardian.email}</p>
              <p><strong>FCM Token:</strong> {guardian.fcmTokenPreview}</p>
              {guardian.lastTokenUpdate && (
                <p><strong>Last Updated:</strong> {new Date(guardian.lastTokenUpdate.toDate()).toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {guardians.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No guardians found</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0C878] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading guardians...</p>
        </div>
      )}
    </div>
  )
} 