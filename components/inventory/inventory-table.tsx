"use client"

import { useState } from "react"
import { MoreHorizontal, ArrowUpDown, AlertCircle, Calendar } from "lucide-react"

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { InventoryItem } from "@/lib/types"

interface InventoryTableProps {
  items: InventoryItem[]
  onEdit: (item: InventoryItem) => void
  onDelete: (id: string) => void
}

export function InventoryTable({ items, onEdit, onDelete }: InventoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Check if an item is low on stock
  const isLowStock = (item: InventoryItem) => {
    return item.quantity <= item.minimumQuantity
  }

  // Check if an item is expiring soon (within 30 days)
  const isExpiringSoon = (item: InventoryItem) => {
    const expiryDate = new Date(item.expiryDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow && expiryDate >= today
  }

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.name}</span>
            {isLowStock(item) && (
              <span title="Low stock">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </span>
            )}
            {isExpiringSoon(item) && (
              <span title="Expiring soon">
                <Calendar className="h-4 w-4 text-amber-500" />
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Category",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <Badge
            variant="outline"
            className={type === "food" ? "bg-green-100 hover:bg-green-100" : "bg-blue-100 hover:bg-blue-100"}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Quantity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const item = row.original
        const isLow = isLowStock(item)

        return (
          <div className={`font-medium ${isLow ? "text-red-500" : ""}`}>
            {item.quantity} {item.unit}
            {isLow && <div className="text-xs text-red-500">Min: {item.minimumQuantity}</div>}
          </div>
        )
      },
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Expiry Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const expiryDate = row.getValue("expiryDate") as string
        const isExpiring = isExpiringSoon(row.original)

        return <div className={`${isExpiring ? "text-amber-500 font-medium" : ""}`}>{formatDate(expiryDate)}</div>
      },
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => <div>{row.getValue("location")}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: items,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="rounded-md border border-[#DDEB9D] bg-[#FAF6E9]">
      <div className="rounded-md border">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={isLowStock(row.original) ? "bg-red-50" : isExpiringSoon(row.original) ? "bg-amber-50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No inventory items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 p-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} item(s) total
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
