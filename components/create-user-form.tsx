"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// User schema for flat user object
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  role: z.string().min(2, "Role is required"),
  startDate: z.string().min(1, "Start date is required"),
  permissions: z.array(z.string()).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

// Use your provided default values
const defaultValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "",
  startDate: "",
  permissions: [],
}

type FormValues = z.infer<typeof userSchema>

interface CreateUserFormProps {
  initialValues?: Partial<FormValues>
  mode?: "create" | "update"
  uid?: string | null
}

export function CreateUserForm({ initialValues, mode = "create", uid }: CreateUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialValues || defaultValues,
    mode: "onChange",
  })

  useEffect(() => {
    if (initialValues) {
      form.reset({ ...defaultValues, ...initialValues, password: "", confirmPassword: "" })
    }
  }, [initialValues])

  // Permissions list
  const permissionsList = [
    "User Management",
    "Financial Records",
    "Resident Records",
    "Inventory Management",
    "Reports",
    "System Settings",
  ]

  // Handle permission checkbox
  const handlePermissionChange = (permission: string) => {
    const current = form.getValues("permissions") || []
    if (current.includes(permission)) {
      form.setValue(
        "permissions",
        current.filter((p) => p !== permission)
      )
    } else {
      form.setValue("permissions", [...current, permission])
    }
  }

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    try {
      let res, result
      if (mode === "update" && uid) {
        res = await fetch(`/api/users?uid=${uid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        result = await res.json()
        if (result.success) {
          toast("User updated successfully", {
            description: `${data.name} has been updated as a ${data.role}`,
          })
        } else {
          toast.error("Error updating user", {
            description: result.error || "There was a problem updating the user. Please try again.",
          })
        }
      } else {
        res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        result = await res.json();
        if (result.success) {
          toast('User created successfully', {
            description: `${data.name} has been added as a ${data.role}`,
          });
          form.reset(defaultValues);
        } else {
          toast.error('Error creating user', {
            description: result.error || 'There was a problem creating the user. Please try again.',
          });
        }
      }
    } catch (error: any) {
      toast.error(mode === "update" ? 'Error updating user' : 'Error creating user', {
        description: error.message || 'There was a problem. Please try again.',
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="rounded-md bg-[#DDEB9D]/30 p-4">
            <h2 className="mb-4 text-lg font-medium">Basic Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel>Select User Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]">
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(123) 456-7890" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={date => field.onChange(date ? date.toISOString() : "")}
                          disabled={(date: Date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="rounded-md bg-[#DDEB9D]/30 p-4">
            <h2 className="mb-4 text-lg font-medium">Security</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-white border-[#DDEB9D] focus:ring-[#A0C878]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            className="border-[#DDEB9D] bg-white hover:bg-[#DDEB9D] hover:text-black"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "update" ? "Updating..." : "Creating..."}
              </>
            ) : (
              mode === "update" ? "Update User" : "Create User"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
