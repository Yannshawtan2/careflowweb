"use client"

import { useState, useEffect } from "react"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InventoryItem } from "@/lib/types"
import { toast } from "sonner"

export function InventoryAlerts() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/inventory')
        const data = await response.json()
        
        if (data.success) {
          setInventoryItems(data.items)
        } else {
          throw new Error(data.error || 'Failed to fetch inventory')
        }
      } catch (error: any) {
        console.error('Error fetching inventory:', error)
        toast.error("Error loading inventory data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInventoryItems()
  }, [])

  // Filter items that need restocking (quantity <= minimumQuantity)
  const itemsNeedingRestock = inventoryItems.filter(item => item.quantity <= item.minimumQuantity)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#A0C878] mr-2"></div>
        Loading inventory alerts...
      </div>
    )
  }

  if (itemsNeedingRestock.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <Package className="h-8 w-8 text-green-500 mb-2" />
        <p className="text-sm text-muted-foreground">No inventory alerts</p>
        <p className="text-xs text-muted-foreground">All items are well stocked</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-[#FFFDF6]">
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Current Stock</TableHead>
          <TableHead className="text-right">Min Required</TableHead>
          <TableHead className="text-right">Unit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {itemsNeedingRestock.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#A0C878]" />
                {item.name}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <span className={item.quantity <= item.minimumQuantity ? "text-red-600 font-semibold" : ""}>
                {item.quantity}
              </span>
            </TableCell>
            <TableCell className="text-right">{item.minimumQuantity}</TableCell>
            <TableCell className="text-right">{item.unit}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
