"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { billingService } from "@/lib/services/billing-service"
import type { BillingSubscription } from "@/lib/types"

interface EditSubscriptionModalProps {
  subscription: BillingSubscription
  onSuccess: () => void
}

export function EditSubscriptionModal({ subscription, onSuccess }: EditSubscriptionModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: subscription.amount.toString(),
    frequency: subscription.frequency,
    description: subscription.description,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await billingService.editSubscription({
        subscriptionId: subscription.id,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        description: formData.description,
      })

      toast.success("Subscription updated successfully")
      setOpen(false)
      onSuccess()
    } catch (error: any) {
      toast.error("Failed to update subscription", {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit subscription</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guardianName">Guardian Name</Label>
            <Input
              id="guardianName"
              value={subscription.guardianName}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="border-[#DDEB9D] focus:ring-[#A0C878]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}
            >
              <SelectTrigger className="border-[#DDEB9D] focus:ring-[#A0C878]">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter subscription description"
              className="border-[#DDEB9D] focus:ring-[#A0C878]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="border-[#DDEB9D] hover:bg-[#DDEB9D] hover:text-black"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#A0C878] hover:bg-[#8BB567] text-white"
            >
              {isLoading ? "Updating..." : "Update Subscription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 