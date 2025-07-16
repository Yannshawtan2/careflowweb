import { StaffSidebar } from "@/components/staff-sidebar"
export default function StaffDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAF6E9]">
      <div className="flex">
        <StaffSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 