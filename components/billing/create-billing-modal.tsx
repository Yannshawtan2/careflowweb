"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { billingService } from "@/lib/services/billing-service"
import { getStripe } from "@/lib/stripe-client"
import { guardianService, type Guardian } from "@/lib/services/guardian-service"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
  guardianId: z.string().min(1, "Please select a guardian"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  frequency: z.enum(["monthly", "quarterly", "yearly"], {
    required_error: "Please select a billing frequency",
  }),
  description: z.string().min(1, "Description is required"),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  activateImmediately: z.boolean(),
  lineItems: z.array(z.object({
    item: z.string().min(1, "Item name is required"),
    price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  })).optional(),
})

interface CreateBillingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateBillingModal({ isOpen, onClose }: CreateBillingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guardianId: "",
      amount: 0,
      frequency: "monthly",
      description: "",
      startDate: new Date(),
      activateImmediately: true,
      lineItems: [],
    },
  })

  const watchedValues = form.watch()

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

  useEffect(() => {
    const fetchGuardians = async () => {
      try {
        setIsLoading(true)
        const data = await guardianService.getGuardians()
        setGuardians(data)
      } catch (error) {
        toast.error("Error loading guardians", {
          description: "Failed to load guardian list. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchGuardians()
    }
  }, [isOpen])

  // Calculate next payment date based on frequency and start date
  const getNextPaymentDate = (startDate: Date, frequency: string) => {
    const date = new Date(startDate)
    switch (frequency) {
      case "monthly":
        date.setMonth(date.getMonth() + 1)
        break
      case "quarterly":
        date.setMonth(date.getMonth() + 3)
        break
      case "yearly":
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    return date
  }

  // Replace the onSubmit function in your component with this:
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // First, ensure the guardian has a Stripe customer
      const selectedGuardian = guardians.find(g => g.uid === values.guardianId)
      if (!selectedGuardian) {
        throw new Error('Selected guardian not found')
      }

      // Check if guardian already has a Stripe customer
      const customerResponse = await fetch(`/api/billing/customer?guardianId=${values.guardianId}`)
      const customerData = await customerResponse.json()

      let customerId = customerData.customerId

      // If no customer exists, create one
      if (!customerData.exists) {
        setIsCreatingCustomer(true)
        const createCustomerResponse = await fetch('/api/billing/customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guardianId: values.guardianId,
            email: selectedGuardian.email,
            name: selectedGuardian.name,
            phone: selectedGuardian.phone,
          }),
        })

        if (!createCustomerResponse.ok) {
          const errorData = await createCustomerResponse.json()
          throw new Error(errorData.error || 'Failed to create Stripe customer')
        }

        const newCustomerData = await createCustomerResponse.json()
        customerId = newCustomerData.customerId

        toast.success("Customer account created", {
          description: "Stripe customer account has been set up for the guardian",
        })
        setIsCreatingCustomer(false)
      }

      // Now create the subscription
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guardianId: values.guardianId,
          amount: values.amount,
          frequency: values.frequency,
          description: values.description,
          startDate: values.startDate.toISOString(),
          lineItems: values.lineItems || [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create subscription')
      }

      const { subscriptionId, clientSecret } = await response.json()

      // Initialize Stripe payment (this should work on client-side)
      const stripe = await getStripe()
      if (!stripe) throw new Error("Stripe failed to initialize")

      // Confirm the payment
      const { error } = await stripe.confirmCardPayment(clientSecret)
      
      if (error) {
        throw new Error(error.message)
      }

      toast.success("Billing subscription created", {
        description: `Recurring billing has been set up for ${selectedGuardian.name}`,
      })

      form.reset()
      onClose()
    } catch (error: any) {
      console.error('Subscription creation error:', error)
      toast.error("Error creating subscription", {
        description: error.message || "There was a problem creating the billing subscription. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
      setIsCreatingCustomer(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#FAF6E9] border-[#DDEB9D] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#A0C878]">Create Recurring Bill</DialogTitle>
          <DialogDescription>Set up a new recurring billing subscription for a guardian.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="guardianId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]">
                          <SelectValue placeholder={isLoading ? "Loading guardians..." : "Select a guardian"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guardians.map((guardian) => (
                          <SelectItem key={guardian.uid} value={guardian.uid}>
                            {guardian.name} - {guardian.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Amount</FormLabel>
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

            <div className="grid gap-4 md:grid-cols-2">
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-white border-[#DDEB9D] focus:ring-[#A0C878]",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                  <FormDescription>This will appear on invoices and billing statements.</FormDescription>
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
                  <p className="text-sm">No additional line items added</p>
                  <p className="text-xs">Click "Add Item" to include extra charges on the invoice</p>
                </div>
              )}
            </div>

            {/* Preview Section */}
            {watchedValues.amount > 0 && watchedValues.startDate && (
              <Card className="bg-[#DDEB9D]/30 border-[#DDEB9D]">
                <CardHeader>
                  <CardTitle className="text-sm">Billing Preview</CardTitle>
                  <CardDescription>Review the billing details before creating</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>First charge date:</span>
                    <span className="font-medium">{format(watchedValues.startDate, "PPP")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Next payment date:</span>
                    <span className="font-medium">
                      {format(getNextPaymentDate(watchedValues.startDate, watchedValues.frequency), "PPP")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Base amount per {watchedValues.frequency.replace("ly", "")}:</span>
                    <span className="font-medium">
                      ${Number(watchedValues.amount).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Line Items Preview */}
                  {watchedValues.lineItems && watchedValues.lineItems.length > 0 && (
                    <>
                      <div className="border-t pt-2 mt-2">
                        <div className="text-sm font-medium mb-1">Additional Items:</div>
                        {watchedValues.lineItems.map((item, index) => (
                          item.item && item.price > 0 && (
                            <div key={index} className="flex justify-between text-sm text-muted-foreground">
                              <span>{item.item}</span>
                              <span>${Number(item.price).toFixed(2)}</span>
                            </div>
                          )
                        ))}
                      </div>
                      <div className="flex justify-between text-sm font-medium border-t pt-2">
                        <span>Total per {watchedValues.frequency.replace("ly", "")}:</span>
                        <span>
                          ${(
                            Number(watchedValues.amount) + 
                            (watchedValues.lineItems?.reduce((sum, item) => sum + (Number(item.price) || 0), 0) || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[#DDEB9D] bg-white hover:bg-[#DDEB9D] hover:text-black"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-[#DDEB9D] bg-white hover:bg-[#DDEB9D] hover:text-black"
              >
                Save as Draft
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCreatingCustomer ? "Creating Customer..." : "Creating Subscription..."}
                  </>
                ) : (
                  "Create & Activate"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
