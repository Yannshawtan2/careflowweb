import type { Metadata } from "next"

import { BillingDashboard } from "@/components/billing/billing-dashboard"

export const metadata: Metadata = {
  title: "Billing Management",
  description: "Manage recurring billing and subscriptions",
}

export default function BillingPage() {
  return (
    <div className="flex min-h-screen bg-[#FFFDF6]">
      <div className="flex-1 p-4 md:p-8 pt-6 overflow-y-auto">
        <BillingDashboard />
      </div>
    </div>
  )
}
