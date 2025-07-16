"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { DonationCampaign } from "@/lib/types"
import { useRouter } from "next/navigation"

const CLOUDINARY_UPLOAD_PRESET = "caredonations"
const CLOUDINARY_CLOUD_NAME = "druki2lt2"

export default function ManageDonationCampaignsPage() {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editCampaign, setEditCampaign] = useState<DonationCampaign | null>(null)
  const [editForm, setEditForm] = useState({ title: "", description: "", goal: "", imageUrl: "" })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ title: "", description: "", goal: "", imageUrl: "" })
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/donations/campaign?all=1")
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      toast.error("Failed to load campaigns")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (campaign: DonationCampaign) => {
    setEditCampaign(campaign)
    setEditForm({
      title: campaign.title,
      description: campaign.description,
      goal: String(campaign.goalAmount),
      imageUrl: campaign.imageUrl || ""
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCampaign) return
    setIsEditLoading(true)
    try {
      const response = await fetch(`/api/donations/campaign?id=${editCampaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          goalAmount: Number(editForm.goal),
          imageUrl: editForm.imageUrl,
        }),
      })
      if (!response.ok) throw new Error("Failed to update campaign")
      toast.success("Campaign updated!")
      setIsEditModalOpen(false)
      fetchCampaigns()
    } catch (error: any) {
      toast.error("Error updating campaign", { description: error.message })
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return
    try {
      const response = await fetch(`/api/donations/campaign?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete campaign")
      toast.success("Campaign deleted!")
      fetchCampaigns()
    } catch (error: any) {
      toast.error("Error deleting campaign", { description: error.message })
    }
  }

  const handleCreateImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", { description: "Please select a valid image file (JPEG, PNG, GIF, WebP)" })
      return
    }
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("File too large", { description: "Please select an image smaller than 5MB" })
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      if (data.secure_url) {
        setCreateForm(f => ({ ...f, imageUrl: data.secure_url }))
        toast.success("Image uploaded successfully!")
      } else {
        throw new Error("Cloudinary upload failed - no secure_url received")
      }
    } catch (err: any) {
      toast.error("Image upload failed", { description: err.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!createForm.description.trim()) {
      toast.error("Description is required")
      return
    }
    if (!createForm.goal || Number(createForm.goal) <= 0) {
      toast.error("Valid goal amount is required")
      return
    }
    setIsCreateLoading(true)
    const campaignData = {
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      goalAmount: Number(createForm.goal),
      imageUrl: createForm.imageUrl || '',
    }
    try {
      const response = await fetch("/api/donations/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create campaign")
      }
      toast.success("Donation campaign created successfully!")
      setIsCreateModalOpen(false)
      setCreateForm({ title: "", description: "", goal: "", imageUrl: "" })
      fetchCampaigns()
    } catch (error: any) {
      toast.error("Error creating campaign", { description: error.message })
    } finally {
      setIsCreateLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#FFFDF6]">
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[#A0C878]">Manage Donation Campaigns</h1>
            <Button className="bg-[#A0C878] hover:bg-[#8AB868] text-white" onClick={() => setIsCreateModalOpen(true)}>
              + Create Campaign
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-20">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No campaigns found.</div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {campaigns.map(campaign => (
                <Card key={campaign.id} className="bg-[#FAF6E9] border-[#DDEB9D] flex flex-col">
                  {campaign.imageUrl && (
                    <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-48 object-cover rounded-t-md" />
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl text-[#A0C878]">{campaign.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="mb-4 text-gray-700">{campaign.description}</p>
                    <div className="mb-4 text-xs text-muted-foreground">Goal: MYR {campaign.goalAmount}</div>
                    <div className="mb-4 text-xs text-muted-foreground">
                      Raised: MYR {campaign.totalRaised || 0} ({campaign.donationCount || 0} donations)
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-[#A0C878] hover:bg-[#8AB868] text-white" onClick={() => handleEdit(campaign)}>Edit</Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(campaign.id)}>Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Donation Campaign</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreateSubmit}>
              <div>
                <Label htmlFor="create-title">Title</Label>
                <Input id="create-title" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} required className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" placeholder="Enter campaign title" />
              </div>
              <div>
                <Label htmlFor="create-description">Description</Label>
                <Textarea id="create-description" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} required className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" placeholder="Describe your campaign" rows={4} />
              </div>
              <div>
                <Label htmlFor="create-goal">Goal Amount (MYR)</Label>
                <Input id="create-goal" type="number" min="1" step="0.01" value={createForm.goal} onChange={e => setCreateForm(f => ({ ...f, goal: e.target.value }))} required className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" placeholder="Enter target amount" />
              </div>
              <div>
                <Label htmlFor="create-image">Campaign Image</Label>
                <Input id="create-image" type="file" accept="image/*" onChange={handleCreateImageChange} className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" />
                {isUploading && (
                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                    Uploading image...
                  </div>
                )}
                {createForm.imageUrl && (
                  <div className="mt-2">
                    <img src={createForm.imageUrl} alt="Preview" className="rounded-md w-full h-40 object-cover border border-[#DDEB9D]" />
                    <p className="text-xs text-green-600 mt-1">✓ Image uploaded successfully</p>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full bg-[#A0C878] hover:bg-[#8AB868] text-white" disabled={isCreateLoading || isUploading}>
                {isCreateLoading ? "Creating..." : "Create Campaign"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} required className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" />
              </div>
              <div>
                <Label htmlFor="edit-goal">Goal Amount (MYR)</Label>
                <Input id="edit-goal" type="number" min="1" value={editForm.goal} onChange={e => setEditForm(f => ({ ...f, goal: e.target.value }))} required className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" />
              </div>
              <div>
                <Label htmlFor="edit-imageUrl">Image URL</Label>
                <Input id="edit-imageUrl" value={editForm.imageUrl} onChange={e => setEditForm(f => ({ ...f, imageUrl: e.target.value }))} className="border-[#DDEB9D] focus:ring-[#A0C878] bg-white" />
              </div>
              <Button type="submit" className="w-full bg-[#A0C878] hover:bg-[#8AB868] text-white" disabled={isEditLoading}>
                {isEditLoading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 