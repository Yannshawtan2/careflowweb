'use client';
import Link from "next/link";
import { Nav } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";

export const AdminHeader = () => {
  return (
    <Nav
      className="border-b bg-[#E0F2F1] dark:bg-[A0C878] w-full"
    >
      <div className="container mx-auto px-1 py-2 flex justify-between items-center w-full">
        <div className="flex-none">
          <Link 
            className="font-semibold tracking-tight text-[#00796B] hover:text-[#004D40] text-lg"
            href="/admindashboard"
          >
            <span className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 mr-2"
              >
                <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"></path>
                <path d="M4 8h16"></path>
                <path d="M8 4v4"></path>
                <path d="M9 14h6"></path>
                <path d="M15 12v4"></path>
                <path d="M9 12v4"></path>
              </svg>
              Admin Dashboard
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-none">
          <Link 
            href="/admindashboard/users" 
            className="text-[#00796B] hover:text-[#004D40] font-medium px-2 py-1 rounded-md hover:bg-[#B2DFDB]/50 transition-colors"
          >
            Users
          </Link>
          <Link 
            href="/admindashboard/settings" 
            className="text-[#00796B] hover:text-[#004D40] font-medium px-2 py-1 rounded-md hover:bg-[#B2DFDB]/50 transition-colors"
          >
            Settings
          </Link>
          <Button 
            variant="outline" 
            className="border-[#00796B] dark:bg-[#DDEB9D] text-[#00796B] hover:bg-[#B2DFDB] hover:text-[#004D40] ml-2"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </div>
    </Nav>
  );
}; 