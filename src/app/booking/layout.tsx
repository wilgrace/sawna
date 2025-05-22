import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { BookingHeader } from "@/components/booking/booking-header"

export default async function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const isAdmin = false // We'll implement admin check later

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <BookingHeader isAuthenticated={!!userId} isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
