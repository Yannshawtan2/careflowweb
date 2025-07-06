import { StaffHeader } from "@/components/StaffHeader"
import { AdminSidebar } from "@/components/staff-sidebar"

export default function StaffDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAF6E9]">
      <StaffHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 