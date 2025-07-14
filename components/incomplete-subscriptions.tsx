"use client"

import { useState, useEffect } from "react"
import { CreditCard, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { billingService } from "@/lib/services/billing-service"
import type { BillingSubscription } from "@/lib/types"
import { toast } from "sonner"

export function IncompleteSubscriptions() {
  const [incompleteSubscriptions, setIncompleteSubscriptions] = useState<BillingSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchIncompleteSubscriptions = async () => {
      try {
        setIsLoading(true)
        const allSubscriptions = await billingService.getSubscriptions()
        const incomplete = allSubscriptions.filter((sub: BillingSubscription) => sub.status === 'incomplete')
        setIncompleteSubscriptions(incomplete)
      } catch (error: any) {
        console.error('Error fetching incomplete subscriptions:', error)
        toast.error("Error loading incomplete subscriptions")
      } finally {
        setIsLoading(false)
      }
    }

    fetchIncompleteSubscriptions()
  }, [])

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#A0C878] mr-2"></div>
        Loading incomplete subscriptions...
      </div>
    )
  }

  if (incompleteSubscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <AlertCircle className="h-8 w-8 text-green-500 mb-2" />
        <p className="text-sm text-muted-foreground">No incomplete subscriptions found</p>
        <p className="text-xs text-muted-foreground">All payments are up to date</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-[#FFFDF6]">
          <TableHead>Guardian</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {incompleteSubscriptions.map((subscription) => (
          <TableRow key={subscription.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#A0C878]" />
                {subscription.guardianName}
              </div>
            </TableCell>
            <TableCell>{formatCurrency(subscription.amount)}</TableCell>
            <TableCell className="capitalize">{subscription.frequency}</TableCell>
            <TableCell>{formatDate(subscription.createdAt)}</TableCell>
            <TableCell>
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                Incomplete
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 