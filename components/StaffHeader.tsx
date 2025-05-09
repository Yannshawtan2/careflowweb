'use client';
import Link from "next/link";
import { Nav } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";

export const StaffHeader = () => {
  return (
    <Nav
      containerClassName="flex justify-between items-center gap-2 sticky top-0 z-50"
      className="border-b bg-[#E8F5E9] dark:bg-[#1B5E20]/20"
    >
      <Link className="font-semibold tracking-tight text-[#2E7D32]" href="/staffdashboard">
        Staff Dashboard
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/staffdashboard/patients" className="text-[#2E7D32] hover:text-[#1B5E20]">
          Patients
        </Link>
        <Link href="/staffdashboard/appointments" className="text-[#2E7D32] hover:text-[#1B5E20]">
          Appointments
        </Link>
        <Button 
          variant="outline" 
          className="border-[#2E7D32] text-[#2E7D32] hover:bg-[#E8F5E9]"
          onClick={logout}
        >
          Logout
        </Button>
      </div>
    </Nav>
  );
}; 