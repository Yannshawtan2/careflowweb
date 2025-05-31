"use client"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { CreateUserForm } from "@/components/create-user-form"
import { Button } from "@/components/ui/button"

export default function CreateUserPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const uid = searchParams.get("uid")
  // @ts-ignore
  const routerState = router && "state" in router ? (router as any).state : undefined
  const [initialValues, setInitialValues] = useState<any | null>(routerState || null)
  const [loading, setLoading] = useState(!!uid && !routerState)

  useEffect(() => {
    if (uid && !routerState) {
      setLoading(true)
      fetch(`/api/users?uid=${uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) setInitialValues(data.user)
        })
        .finally(() => setLoading(false))
    }
  }, [uid, routerState])
  function handleEdit(user: any) {
    router.push(`/admindashboard/users/create?uid=${user.uid}`);
  }

  return (
    <div className="min-h-screen bg-[#FFFDF6] p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="h-8 w-8 border-[#DDEB9D] bg-[#FAF6E9] hover:bg-[#DDEB9D]"
          >
            <Link href="/admindashboard/users">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to users</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-[#A0C878]">
            {uid ? "Update User" : "Create New User"}
          </h1>
        </div>

        <div className="rounded-lg border border-[#DDEB9D] bg-[#FAF6E9] p-6">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <CreateUserForm initialValues={initialValues} mode={uid ? "update" : "create"} uid={uid} />
          )}
        </div>
      </div>
    </div>
  )
}
