"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Edit, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { billingService } from "@/lib/services/billing-service"
import type { BillingSubscription } from "@/lib/types"

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  frequency: z.enum(["monthly", "quarterly", "yearly"], {
    required_error: "Please select a billing frequency",
  }),
  description: z.string().min(1, "Description is required"),
  lineItems: z.array(z.object({
    item: z.string().min(1, "Item name is required"),
    price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  })).optional(),
})

interface EditSubscriptionModalProps {
  subscription: BillingSubscription
  onSuccess: () => void
}

export function EditSubscriptionModal({ subscription, onSuccess }: EditSubscriptionModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      frequency: "monthly",
      description: "",
      lineItems: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  })

  const addLineItem = () => {
    append({ item: "", price: 0 })
  }

  const removeLineItem = (index: number) => {
    remove(index)
  }

  // Load subscription details when modal opens
  const loadSubscriptionDetails = async () => {
    if (!open) return

    setIsLoadingDetails(true)
    try {
      console.log('Loading subscription details for ID:', subscription.id)
      const details = await billingService.getSubscriptionDetails(subscription.id)
      console.log('Loaded subscription details:', details)
      
      // Reset form with loaded data
      form.reset({
        amount: details.baseAmount,
        frequency: details.frequency,
        description: details.description,
        lineItems: details.lineItems || [],
      })
    } catch (error: any) {
      console.error('Error loading subscription details:', error)
      toast.error("Failed to load subscription details", {
        description: error.message,
      })
      
      // Fallback to using the data from the table
      form.reset({
        amount: subscription.amount,
        frequency: subscription.frequency,
        description: subscription.description,
        lineItems: [],
      })
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Load details when modal opens
  useEffect(() => {
    loadSubscriptionDetails()
  }, [open])

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      const isFrequencyChanging = values.frequency !== subscription.frequency
      
      await billingService.editSubscription({
        subscriptionId: subscription.id,
        amount: values.amount,
        frequency: values.frequency,
        description: values.description,
        lineItems: values.lineItems || [],
      })

      if (isFrequencyChanging) {
        toast.success("Subscription updated successfully", {
          description: "Billing frequency has been changed and will start a new billing cycle immediately",
        })
      } else {
        toast.success("Subscription updated successfully", {
          description: "Changes will take effect on the next billing cycle",
        })
      }
      
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
      <DialogContent className="sm:max-w-[600px] bg-[#FAF6E9] border-[#DDEB9D] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#A0C878]">Edit Subscription</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#A0C878] mr-2"></div>
                <span className="text-muted-foreground">Loading subscription details...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Guardian Name</Label>
                  <Input
                    id="guardianName"
                    value={subscription.guardianName}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8 bg-white border-[#DDEB9D] focus:ring-[#A0C878]"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                          value={field.value || ''}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.watch("frequency") !== subscription.frequency && (
                      <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                        <strong>Note:</strong> Changing billing frequency will start a new billing cycle immediately.
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter billing description or notes..."
                      className="bg-white border-[#DDEB9D] focus:ring-[#A0C878] resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">Additional Line Items</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                  className="border-[#DDEB9D] bg-white hover:bg-[#DDEB9D] hover:text-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              {fields.length > 0 && (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.item`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Item</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Medication Fee"
                                  className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="w-32">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Price</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pl-8 bg-white border-[#DDEB9D] focus:ring-[#A0C878]"
                                    {...field}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      field.onChange(value);
                                    }}
                                    value={field.value || ''}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 mb-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No additional line items</p>
                  <p className="text-xs">Click "Add Item" to include extra charges</p>
                </div>
              )}
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
                disabled={isLoading || isLoadingDetails}
                className="bg-[#A0C878] hover:bg-[#8BB567] text-white"
              >
                {isLoading ? "Updating..." : "Update Subscription"}
              </Button>
            </div>
            </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 