"use client"

import { useEffect, useState } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { StaffSidebar } from "./staff-sidebar"

export function DynamicSidebar() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const determineUserRole = () => {
      // Check the current path to determine user role
      const path = window.location.pathname
      
      if (path.startsWith('/admindashboard') || path.startsWith('/admin')) {
        setUserRole('admin')
        localStorage.setItem('userRole', 'admin')
      } else if (path.startsWith('/staffdashboard') || path.startsWith('/staff')) {
        setUserRole('staff')
        localStorage.setItem('userRole', 'staff')
      } else {
        // For shared pages like inventory, check localStorage
        const storedRole = localStorage.getItem('userRole')
        if (storedRole) {
          setUserRole(storedRole)
        } else {
          // Try to get role from cookies
          const cookies = document.cookie.split(';')
          const roleCookie = cookies.find(cookie => cookie.trim().startsWith('userRole='))
          if (roleCookie) {
            const role = roleCookie.split('=')[1]
            setUserRole(role)
            localStorage.setItem('userRole', role)
          } else {
            // Default to admin for inventory if no role is stored
            setUserRole('admin')
            localStorage.setItem('userRole', 'admin')
          }
        }
      }
      setIsLoading(false)
    }

    determineUserRole()
  }, [])

  if (isLoading) {
    return (
      <div className="hidden border-r border-[#DDEB9D] bg-[#FAF6E9] md:flex md:w-64 md:flex-col">
        <div className="flex flex-col space-y-2 p-4">
          <div className="flex h-16 items-center px-4">
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (userRole === 'staff') {
    return <StaffSidebar />
  }

  // Default to admin sidebar
  return <AdminSidebar />
} 