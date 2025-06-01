"use client"

import { useState, useEffect } from "react"
import { Package, AlertTriangle, Calendar, Filter, Plus, Search } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { AddEditItemModal } from "@/components/inventory/add-edit-item-modal"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { InventoryItem } from "@/lib/types"

export function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  // Calculate summary statistics
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const lowStockItems = items.filter((item) => item.quantity <= item.minimumQuantity)
  const expiringItems = items.filter((item) => {
    const expiryDate = new Date(item.expiryDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow && expiryDate >= today
  })

  const foodItems = items.filter((item) => item.type === "food")
  const medicalItems = items.filter((item) => item.type === "medical")

  // Fetch inventory data from API on mount
  useEffect(() => {
    async function fetchInventory() {
      try {
        const response = await fetch('/api/inventory')
        const data = await response.json()
        if (data.success) {
          setItems(data.items)
        } else {
          // Optionally handle error
          alert('Failed to fetch inventory: ' + data.error)
        }
      } catch (error) {
        alert('Failed to fetch inventory: ' + error)
      }
    }
    fetchInventory()
  }, [])

  // Filter items based on search query and category
  useEffect(() => {
    let filtered = [...items]

    if (searchQuery) {
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.type === categoryFilter)
    }

    setFilteredItems(filtered)
  }, [items, searchQuery, categoryFilter])

  // Handle adding a new item
  const handleAddItem = async (newItem: Partial<InventoryItem>) => {
    try {
      // Remove id if present
      const { id, ...itemData } = newItem
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })
      const data = await response.json()
      if (data.success) {
        // Fetch the latest inventory from Firestore
        const fetchResponse = await fetch('/api/inventory')
        const fetchData = await fetchResponse.json()
        if (fetchData.success) {
          setItems(fetchData.items)
        }
      } else {
        alert('Failed to add item: ' + data.error)
      }
    } catch (error) {
      alert('Failed to add item: ' + error)
    }
  }

  // Handle editing an item
  const handleEditItem = async (updatedItem: Partial<InventoryItem>) => {
    if (!updatedItem.id) {
      alert('Missing Firestore document ID for update.');
      return;
    }
    try {
      const response = await fetch(`/api/inventory?id=${updatedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      })
      const data = await response.json()
      if (data.success) {
        // Fetch the latest inventory from Firestore
        const fetchResponse = await fetch('/api/inventory')
        const fetchData = await fetchResponse.json()
        if (fetchData.success) {
          setItems(fetchData.items)
        }
        setEditingItem(null)
      } else {
        alert('Failed to update item: ' + data.error)
      }
    } catch (error) {
      alert('Failed to update item: ' + error)
    }
  }

  // Handle deleting an item
  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/inventory?id=${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        const updatedItems = items.filter((item) => item.id !== id)
        setItems(updatedItems)
      } else {
        alert('Failed to delete item: ' + data.error)
      }
    } catch (error) {
      alert('Failed to delete item: ' + error)
    }
  }

  // Open edit modal with item data
  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item)
    setIsAddModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#A0C878]">Inventory Management</h1>
        <Button
          onClick={() => {
            setEditingItem(null)
            setIsAddModalOpen(true)
          }}
          className="bg-[#A0C878] hover:bg-[#8AB868] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-[#A0C878]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">{items.length} unique items</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Items below minimum quantity</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{expiringItems.length}</div>
            <p className="text-xs text-muted-foreground">Items expiring within 30 days</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items by Category</CardTitle>
            <Filter className="h-4 w-4 text-[#A0C878]" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-100 hover:bg-blue-100">
                Medical: {medicalItems.length}
              </Badge>
              <Badge variant="outline" className="bg-green-100 hover:bg-green-100">
                Food: {foodItems.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList className="bg-[#FAF6E9] border border-[#DDEB9D]">
            <TabsTrigger
              value="all"
              onClick={() => setCategoryFilter("all")}
              className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black"
            >
              All Items
            </TabsTrigger>
            <TabsTrigger
              value="food"
              onClick={() => setCategoryFilter("food")}
              className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black"
            >
              Food
            </TabsTrigger>
            <TabsTrigger
              value="medical"
              onClick={() => setCategoryFilter("medical")}
              className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black"
            >
              Medical
            </TabsTrigger>
            <TabsTrigger
              value="low-stock"
              onClick={() => setCategoryFilter("low-stock")}
              className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black"
            >
              Low Stock
            </TabsTrigger>
          </TabsList>
          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-white border-[#DDEB9D] focus:ring-[#A0C878]"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-white border-[#DDEB9D] focus:ring-[#A0C878]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <InventoryTable items={filteredItems} onEdit={openEditModal} onDelete={handleDeleteItem} />
        </TabsContent>
        <TabsContent value="food" className="space-y-4">
          <InventoryTable
            items={filteredItems.filter((item) => item.type === "food")}
            onEdit={openEditModal}
            onDelete={handleDeleteItem}
          />
        </TabsContent>
        <TabsContent value="medical" className="space-y-4">
          <InventoryTable
            items={filteredItems.filter((item) => item.type === "medical")}
            onEdit={openEditModal}
            onDelete={handleDeleteItem}
          />
        </TabsContent>
        <TabsContent value="low-stock" className="space-y-4">
          <InventoryTable
            items={filteredItems.filter((item) => item.quantity <= item.minimumQuantity)}
            onEdit={openEditModal}
            onDelete={handleDeleteItem}
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <AddEditItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingItem(null)
        }}
        onSave={editingItem ? handleEditItem : handleAddItem}
        item={editingItem}
      />
    </div>
  )
}
