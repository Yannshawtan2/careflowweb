"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { billingService } from "@/lib/services/billing-service"
import { toast } from "sonner"

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true)
        const data = await billingService.getTransactions()
        // Get only the 5 most recent transactions
        setTransactions(data.slice(0, 5))
      } catch (error: any) {
        console.error('Error fetching transactions:', error)
        toast.error("Error loading transactions", {
          description: "Failed to load transaction data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#A0C878] mr-2"></div>
          <span className="text-muted-foreground">Loading transactions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.length > 0 ? (
        transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{transaction.guardianName}</p>
              <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">${transaction.amount}</span>
              {getStatusBadge(transaction.status)}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-muted-foreground py-4">
          No transactions found
        </div>
      )}
    </div>
  )
}
