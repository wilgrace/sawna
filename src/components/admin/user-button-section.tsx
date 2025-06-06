"use client"

import dynamic from 'next/dynamic'
import { useUser } from "@clerk/nextjs"

// Dynamically import UserButton with no SSR
const UserButton = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.UserButton),
  { ssr: false }
)

export function UserButtonSection() {
  const { isLoaded, user } = useUser()

  if (!isLoaded || !user) {
    return (
      <div className="border-t border-gray-200 p-4">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <UserButton afterSignOutUrl="/sign-in" />
    </div>
  )
} 