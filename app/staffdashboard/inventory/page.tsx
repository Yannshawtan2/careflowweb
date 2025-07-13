import type { Metadata } from "next"

import { InventoryDashboard } from "@/components/inventory/inventory-dashboard"


export const metadata: Metadata = {
  title: "Staff - Inventory Management",
  description: "Staff inventory management system for care homes",
}

export default function StaffInventoryPage() {
  return (
    <div className="flex min-h-screen bg-[#FFFDF6]">
      <div className="flex-1 p-4 md:p-8 pt-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#A0C878]">Staff Inventory Management</h1>
          <p className="text-gray-600">View and manage inventory items</p>
        </div>
        <InventoryDashboard />
      </div>
    </div>
  )
} 