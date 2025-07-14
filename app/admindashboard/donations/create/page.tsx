"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function CreateDonationCampaignPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [goal, setGoal] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch("/api/donations/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          goal: Number(goal),
          imageUrl,
        }),
      })
      if (!response.ok) throw new Error("Failed to create campaign")
      toast.success("Donation campaign created!")
      router.push("/admindashboard")
    } catch (error: any) {
      toast.error("Error creating campaign", { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#FFFDF6] items-center justify-center">
      <Card className="w-full max-w-lg bg-[#FAF6E9] border-[#DDEB9D]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#A0C878]">Create Donation Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" />
            </div>
            <div>
              <Label htmlFor="goal">Goal Amount (MYR)</Label>
              <Input id="goal" type="number" min="1" value={goal} onChange={e => setGoal(e.target.value)} required className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" />
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input id="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" />
            </div>
            <Button type="submit" className="w-full bg-[#A0C878] hover:bg-[#8AB868] text-white" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Campaign"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 