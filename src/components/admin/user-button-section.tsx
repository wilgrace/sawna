"use client"

import { UserButton, useUser } from "@clerk/nextjs"

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