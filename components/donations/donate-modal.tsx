"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { loadStripe } from "@stripe/stripe-js"
import type { DonationCampaign, DonationFormData } from "@/lib/types"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface DonateModalProps {
  campaign: DonationCampaign
}

export function DonateModal({ campaign }: DonateModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<DonationFormData>({
    amount: 0,
    donorEmail: "",
    donorName: "",
    message: "",
  })

  // Calculate remaining amount needed to reach goal
  const currentAmount = campaign.totalRaised || 0
  const goalAmount = campaign.goalAmount
  const remainingAmount = Math.max(0, goalAmount - currentAmount)
  const isGoalReached = currentAmount >= goalAmount

  // Set suggested amount to the remaining amount if it's reasonable
  const suggestedAmount = remainingAmount > 0 && remainingAmount <= 10000 ? remainingAmount : Math.min(remainingAmount, 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || formData.amount <= 0) {
      toast.error("Please enter a valid donation amount")
      return
    }

    if (formData.amount > remainingAmount && remainingAmount > 0) {
      toast.error(`The campaign only needs MYR ${remainingAmount} more to reach its goal. Please consider donating MYR ${remainingAmount} or less.`)
      return
    }

    if (!formData.donorEmail || !formData.donorEmail.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      // Create payment intent with the actual form data
      const response = await fetch("/api/donations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          amount: formData.amount,
          donorEmail: formData.donorEmail,
          donorName: formData.donorName,
          message: formData.message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment")
      }

      // Redirect to Stripe Checkout with the payment intent
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error("Stripe failed to load")
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error: any) {
      toast.error("Payment failed", { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isGoalReached ? (
          <Button 
            className="w-full bg-gray-400 text-white cursor-not-allowed" 
            disabled
          >
            Goal Reached! ✅
          </Button>
        ) : (
          <Button 
            className="w-full bg-[#A0C878] hover:bg-[#8AB868] text-white"
            onClick={() => setOpen(true)}
          >
            Donate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Donate to {campaign.title}</DialogTitle>
          {remainingAmount > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Only <span className="font-semibold text-[#A0C878]">MYR {remainingAmount}</span> more needed to reach the goal!
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Donation Amount (MYR)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={remainingAmount > 0 ? remainingAmount : undefined}
              step="0.01"
              value={formData.amount || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              required
              className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white"
              placeholder={remainingAmount > 0 ? `Max: MYR ${remainingAmount}` : "Enter donation amount"}
            />
            {remainingAmount > 0 && (
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, amount: suggestedAmount }))}
                  className="text-xs border-[#DDEB9D] text-[#A0C878] hover:bg-[#DDEB9D]"
                >
                  Suggest: MYR {suggestedAmount}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, amount: remainingAmount }))}
                  className="text-xs border-[#DDEB9D] text-[#A0C878] hover:bg-[#DDEB9D]"
                >
                  Full Amount: MYR {remainingAmount}
                </Button>
              </div>
            )}
            {formData.amount > remainingAmount && remainingAmount > 0 && (
              <p className="text-red-500 text-xs mt-1">
                Amount exceeds what's needed (MYR {remainingAmount} remaining)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="donorEmail">Email Address</Label>
            <Input
              id="donorEmail"
              type="email"
              value={formData.donorEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, donorEmail: e.target.value }))}
              required
              className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white"
              placeholder="Your email address"
            />
          </div>

          <div>
            <Label htmlFor="donorName">Name (Optional)</Label>
            <Input
              id="donorName"
              type="text"
              value={formData.donorName}
              onChange={(e) => setFormData(prev => ({ ...prev, donorName: e.target.value }))}
              className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white"
              placeholder="Your name"
            />
          </div>

          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white"
              placeholder="Leave a message of support"
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#A0C878] hover:bg-[#8AB868] text-white" 
            disabled={isLoading || (formData.amount > remainingAmount && remainingAmount > 0)}
          >
            {isLoading ? "Processing..." : 
             formData.amount > remainingAmount && remainingAmount > 0 ? "Amount too high" :
             `Donate MYR ${formData.amount || 0}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 