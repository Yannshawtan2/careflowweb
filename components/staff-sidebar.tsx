"use client"

import type React from "react"
import { logout } from "@/lib/auth";

import { DollarSign, Home, Package, BookHeart, Users, Heart, LogOut } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function StaffSidebar() {
  return (
    <div className="hidden border-r border-[#DDEB9D] bg-[#FAF6E9] md:flex md:w-64 md:flex-col">
      <div className="flex flex-col space-y-2 p-4">
        <div className="flex h-16 items-center px-4">
          <h2 className="text-lg font-bold text-[#A0C878]">Staff</h2>
        </div>
        <nav className="flex-1 space-y-2">
          <NavItem href="/staffdashboard" icon={Home} >
            Dashboard
          </NavItem>
          <NavItem href="/staffdashboard/patients" icon={Heart}>
            Patients
          </NavItem>
          <NavItem href="/staffdashboard/EHR" icon={BookHeart}>
            EHR
          </NavItem>
          <NavItem href="/staffdashboard/inventory" icon={Package}>
            Inventory
          </NavItem>
        </nav>
        <div className="pt-4">
            <button onClick={logout} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all text-muted-foreground hover:bg-[#DDEB9D] hover:text-black" >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
      </div>
    </div>
  )
}

interface NavItemProps {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  active?: boolean
}

function NavItem({ href, icon: Icon, children, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        active ? "bg-[#DDEB9D] text-black" : "text-muted-foreground hover:bg-[#DDEB9D] hover:text-black",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  )
}
