"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { MoreHorizontal, ArrowUpDown, Download, Pause, X, Trash2 } from "lucide-react"

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BillingSubscription } from "@/lib/types"
import { billingService } from "@/lib/services/billing-service"
import { toast } from "sonner"
import { EditSubscriptionModal } from "./edit-subscription-modal"

export function BillingPlansTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [statusFilter, setStatusFilter] = useState("all")
  const [subscriptions, setSubscriptions] = useState<BillingSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await billingService.getSubscriptions()
      setSubscriptions(data)
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error)
      toast.error("Error loading subscriptions", {
        description: "Failed to load subscription data. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSubscriptions()
  }, [refreshSubscriptions])

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Paused</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }, [])

  const handleStatusUpdate = useCallback(async (subscriptionId: string, newStatus: "active" | "paused" | "cancelled") => {
    try {
      await billingService.updateSubscription({
        subscriptionId,
        status: newStatus,
      })

      toast.success("Subscription updated", {
        description: `Subscription status has been updated to ${newStatus}`,
      })

      // Refresh the table data
      refreshSubscriptions()
    } catch (error: any) {
      toast.error("Error updating subscription", {
        description: error.message || "Failed to update subscription status",
      })
    }
  }, [refreshSubscriptions])

  const handleBulkStatusUpdate = useCallback(async (status: "paused" | "cancelled", selectedRows: any[]) => {
    try {
      await Promise.all(
        selectedRows.map((row) =>
          billingService.updateSubscription({
            subscriptionId: row.original.id,
            status,
          })
        )
      )

      toast.success("Subscriptions updated", {
        description: `Selected subscriptions have been ${status}`,
      })

      // Refresh the table data
      refreshSubscriptions()
    } catch (error: any) {
      toast.error("Error updating subscriptions", {
        description: error.message || "Failed to update subscription statuses",
      })
    }
  }, [refreshSubscriptions])

  const formatDate = useCallback((date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }, [])

  const handleDeleteSubscription = useCallback(async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription? It will remain active until the end of the current billing period.")) {
      return
    }

    try {
      await billingService.deleteSubscription(subscriptionId)
      
      toast.success("Subscription cancelled", {
        description: "Subscription has been scheduled for cancellation at the end of the current billing period",
      })

      refreshSubscriptions()
    } catch (error: any) {
      toast.error("Error cancelling subscription", {
        description: error.message || "Failed to cancel subscription",
      })
    }
  }, [refreshSubscriptions])

  const handleBulkDelete = useCallback(async (selectedRows: any[]) => {
    if (selectedRows.length === 0) {
      toast.error("No subscriptions selected")
      return
    }

    if (!confirm(`Are you sure you want to cancel ${selectedRows.length} subscription(s)? They will remain active until the end of their current billing periods.`)) {
      return
    }

    try {
      await Promise.all(
        selectedRows.map((row) =>
          billingService.deleteSubscription(row.original.id)
        )
      )

      toast.success("Subscriptions cancelled", {
        description: `${selectedRows.length} subscription(s) have been scheduled for cancellation at the end of their current billing periods`,
      })

      refreshSubscriptions()
    } catch (error: any) {
      toast.error("Error cancelling subscriptions", {
        description: error.message || "Failed to cancel subscriptions",
      })
    }
  }, [refreshSubscriptions])

  const columns: ColumnDef<BillingSubscription>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-[#DDEB9D] data-[state=checked]:bg-[#A0C878] data-[state=checked]:border-[#A0C878]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-[#DDEB9D] data-[state=checked]:bg-[#A0C878] data-[state=checked]:border-[#A0C878]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "guardianName",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Guardian Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("guardianName")}</div>,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
        return <div className="font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "frequency",
      header: "Frequency",
      cell: ({ row }) => {
        const frequency = row.getValue("frequency") as string
        return <div className="capitalize">{frequency}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return getStatusBadge(status)
      },
    },
    {
      id: "cancelsOn",
      header: "Cancels On",
      cell: ({ row }) => {
        const cancelAt = row.original.cancelAt
        return cancelAt ? formatDate(cancelAt) : <span className="text-muted-foreground">None</span>
      },
    },
    {
      accessorKey: "nextPaymentDate",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Next Payment
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = row.getValue("nextPaymentDate") as string;
        return <div>{formatDate(date)}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const subscription = row.original

        return (
          <div className="flex items-center space-x-2">
            <EditSubscriptionModal 
              subscription={subscription} 
              onSuccess={refreshSubscriptions}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDeleteSubscription(subscription.id)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Cancel subscription</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate(subscription.id, "paused")}>
                  Pause Subscription
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleStatusUpdate(subscription.id, "cancelled")}
                >
                  Cancel Subscription
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [refreshSubscriptions, handleDeleteSubscription, handleStatusUpdate, formatDate, getStatusBadge])

  const filteredData = useMemo(() => {
    if (statusFilter === "all") {
      return subscriptions
    }
    return subscriptions.filter((sub) => sub.status === statusFilter)
  }, [subscriptions, statusFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Filter guardians..."
            value={(table.getColumn("guardianName")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("guardianName")?.setFilterValue(event.target.value)}
            className="max-w-sm bg-white border-[#DDEB9D] focus:ring-[#A0C878]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white border-[#DDEB9D] focus:ring-[#A0C878]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="cancel_at_period_end">Scheduled to Cancel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          {selectedRows.length > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#DDEB9D] hover:bg-[#DDEB9D] hover:text-black"
                onClick={() => handleBulkStatusUpdate("paused", selectedRows)}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause Selected ({selectedRows.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleBulkStatusUpdate("cancelled", selectedRows)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Selected ({selectedRows.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleBulkDelete(selectedRows)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Cancel Selected ({selectedRows.length})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="border-[#DDEB9D] hover:bg-[#DDEB9D] hover:text-black">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      <div className="rounded-md border border-[#DDEB9D] bg-[#FAF6E9]">
        <Table>
          <TableHeader className="bg-[#FFFDF6]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#A0C878] mr-2"></div>
                    Loading subscriptions...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No subscriptions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-[#DDEB9D] hover:bg-[#DDEB9D] hover:text-black"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-[#DDEB9D] hover:bg-[#DDEB9D] hover:text-black"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
