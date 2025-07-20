"use client"

import type React from "react"
import { logout } from "@/lib/auth";
import { Building, DollarSign, Home, LogOut, Package, Users } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function AdminSidebar() {
  return (
    <div className="border-r border-[#DDEB9D] bg-[#FAF6E9] w-64 flex flex-col">
      <div className="flex flex-col space-y-2 p-4">
        <div className="flex h-16 items-center px-4">
          <h2 className="text-lg font-bold text-[#A0C878]">Admin</h2>
        </div>
        <nav className="flex-1 space-y-2">
          <NavItem href="/admindashboard" icon={Home} >
            Dashboard
          </NavItem>
          <NavItem href="/admindashboard/users" icon={Users}>
            Users
          </NavItem>
          <NavItem href="/admindashboard/inventory" icon={Package}>
            Inventory
          </NavItem>
          <NavItem href="/admindashboard/billing" icon={DollarSign}>
            Billing & Payments
          </NavItem>
          <NavItem href="/admindashboard/donations/manage" icon={DollarSign}>
            Campaigns
          </NavItem>
          <div className="pt-4">
            <button onClick={logout} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all text-muted-foreground hover:bg-[#DDEB9D] hover:text-black" >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </nav>
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
