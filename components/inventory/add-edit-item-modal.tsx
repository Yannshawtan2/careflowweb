"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { InventoryItem } from "@/lib/types"


const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["food", "medical"], {
    required_error: "Please select a category",
  }),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  minimumQuantity: z.coerce.number().min(0, "Minimum quantity cannot be negative"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  unit: z.string().min(1, "Unit is required"),
  location: z.string().min(1, "Location is required"),
})

interface AddEditItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Partial<InventoryItem>) => void
  item: InventoryItem | null
}

export function AddEditItemModal({ isOpen, onClose, onSave, item }: AddEditItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!item

  // Initialize form with default values or item values if editing
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      type: item?.type || "food",
      quantity: item?.quantity || 0,
      minimumQuantity: item?.minimumQuantity || 0,
      expiryDate: item?.expiryDate || new Date().toISOString().split("T")[0],
      unit: item?.unit || "units",
      location: item?.location || "Main Storage",
    },
  })

  // Update form values when item changes
  useEffect(() => {
    if (item) {
      const { name, type, quantity, minimumQuantity, expiryDate, unit, location } = item
      form.reset({
        name,
        type,
        quantity,
        minimumQuantity,
        expiryDate: new Date(expiryDate).toISOString().split("T")[0],
        unit,
        location,
      })
    } else {
      form.reset({
        name: "",
        type: "food",
        quantity: 0,
        minimumQuantity: 0,
        expiryDate: new Date().toISOString().split("T")[0],
        unit: "units",
        location: "Main Storage",
      })
    }
  }, [item, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Only include id if editing
      const updatedItem = isEditing
        ? { id: item.id, ...values }
        : { ...values }

      onSave(updatedItem)
      toast.success(`${values.name} has been ${isEditing ? "updated" : "added"} to inventory`)
      onClose()
    } catch (error) {
      toast.error(
        `Error ${isEditing ? "updating" : "adding"} item. There was a problem with your request. Please try again.`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#FAF6E9] border-[#DDEB9D]">
        <DialogHeader>
          <DialogTitle className="text-[#A0C878]">
            {isEditing ? "Edit Inventory Item" : "Add New Inventory Item"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this inventory item."
              : "Fill in the details to add a new item to inventory."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter item name"
                      {...field}
                      className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem
                            value="food"
                            checked={field.value === "food"}
                            className="border-[#DDEB9D] text-[#A0C878]"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Food</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem
                            value="medical"
                            checked={field.value === "medical"}
                            className="border-[#DDEB9D] text-[#A0C878]"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Medical</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minimumQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                    </FormControl>
                    <FormDescription>Alert threshold</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., boxes, bottles"
                        {...field}
                        className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Main Storage, Kitchen"
                        {...field}
                        className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[#DDEB9D] bg-white hover:bg-[#DDEB9D] hover:text-black"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Adding..."}
                  </>
                ) : isEditing ? (
                  "Update Item"
                ) : (
                  "Add Item"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
