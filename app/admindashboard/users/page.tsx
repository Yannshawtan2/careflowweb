"use client"

import type { Metadata } from "next"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/AdminHeader"
import { CreateUserForm } from "@/components/create-user-form"

// export const metadata: Metadata = {
//   title: "Users",
//   description: "Manage users in the system",
// }

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingUid, setDeletingUid] = useState<string | null>(null)
  const [confirmPopover, setConfirmPopover] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      if (data.success) {
        // Only show users (staff, admins, guardians) in the table, not patients
        const filteredUsers = data.users.filter((user: any) => user.role !== 'patient')
        setUsers(filteredUsers)
      } else {
        setError(data.error || "Failed to fetch users")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(user: any) {
    // Get the user ID - try uid first, then email, then document ID
    const userId = user.uid || user.email || user.id
    if (!userId) {
      alert("Cannot delete user: No valid identifier found")
      return
    }
    
    setDeletingUid(userId)
    try {
      const res = await fetch(`/api/users?uid=${userId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setUsers((prev) => prev.filter((u) => (u.uid || u.email || u.id) !== userId))
      } else {
        alert(data.error || "Failed to delete user")
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete user")
    } finally {
      setDeletingUid(null)
      setConfirmPopover(null)
    }
  }

  function handleEdit(user: any) {
    setEditingUser(user)
    setShowCreateModal(true)
  }

  function handleCreateUser() {
    setEditingUser(null)
    setShowCreateModal(true)
  }

  function handleCloseModal() {
    setShowCreateModal(false)
    setEditingUser(null)
  }

  function handleUserCreated() {
    fetchUsers() // Refresh the users list
  }

  return (
    <>
    <div className="flex min-h-screen bg-[#FFFDF6]">
      <AdminSidebar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#A0C878]">User Management</h2>
            <p className="text-muted-foreground">Manage staff, administrators, and guardians</p>
          </div>
          <Button 
            onClick={handleCreateUser}
            className="bg-[#A0C878] hover:bg-[#8AB868] text-white"
          >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create User
          </Button>
        </div>

        <div className="rounded-lg border border-[#DDEB9D] bg-[#FAF6E9] p-6">
          {loading ? (
            <p className="text-center">Loading users...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No users found. Click the "Create User" button to add a new staff member, administrator, or guardian.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#DDEB9D]">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Start Date</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.uid || user.email || `user-${index}`} className="border-t border-[#DDEB9D]">
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.role}</td>
                      <td className="px-4 py-2">{user.startDate ? new Date(user.startDate).toLocaleDateString() : ""}</td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-[#A0C878] hover:bg-[#DDEB9D] mr-2"
                          onClick={() => handleEdit(user)}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Popover open={confirmPopover === (user.uid || user.email || user.id)} onOpenChange={(open) => setConfirmPopover(open ? (user.uid || user.email || user.id) : null)}>
                          <PopoverTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-100"
                              title="Delete"
                              disabled={deletingUid === user.uid}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56" align="end">
                            <div className="flex flex-col items-center">
                              <span className="mb-2">Are you sure you want to delete <b>{user.name}</b>?</span>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setConfirmPopover(null)}
                                  disabled={deletingUid === user.uid}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(user)}
                                  disabled={deletingUid === (user.uid || user.email || user.id)}
                                >
                                  {deletingUid === (user.uid || user.email || user.id) ? "Deleting..." : "Delete"}
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Create/Edit User Modal */}
    <CreateUserForm
      isOpen={showCreateModal}
      onClose={handleCloseModal}
      onUserCreated={handleUserCreated}
      initialValues={editingUser}
      mode={editingUser ? "update" : "create"}
      uid={editingUser?.uid}
    />
    </>
  )
}
