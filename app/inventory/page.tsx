import type { Metadata } from "next"

import { InventoryDashboard } from "@/components/inventory/inventory-dashboard"
import { DynamicSidebar } from "@/components/dynamic-sidebar"

export const metadata: Metadata = {
  title: "Inventory Management",
  description: "Real-time inventory management system for care homes",
}

export default function InventoryPage() {
  return (
    <div className="flex min-h-screen bg-[#FFFDF6]">
      <DynamicSidebar />
      <div className="flex-1 p-4 md:p-8 pt-6 overflow-y-auto">
        <InventoryDashboard />
      </div>
    </div>
  )
}