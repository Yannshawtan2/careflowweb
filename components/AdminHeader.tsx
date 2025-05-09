'use client';
import Link from "next/link";
import { Nav } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";

export const AdminHeader = () => {
  return (
    <Nav
      containerClassName="flex justify-between items-center gap-2 sticky top-0 z-50"
      className="border-b bg-[#E8F5E9] dark:bg-[#1B5E20]/20"
    >
      <Link className="font-semibold tracking-tight text-[#2E7D32]" href="/admindashboard">
        Admin Dashboard
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/admindashboard/users" className="text-[#2E7D32] hover:text-[#1B5E20]">
          Users
        </Link>
        <Link href="/admindashboard/settings" className="text-[#2E7D32] hover:text-[#1B5E20]">
          Settings
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