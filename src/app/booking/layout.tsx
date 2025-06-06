import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { BookingHeader } from "@/components/booking/booking-header"

export default async function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, orgRole } = await auth()
  
  // Check if user is an admin or super admin
  const isAdmin = orgRole === 'org:admin' || orgRole === 'org:super_admin'

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <BookingHeader isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto md:p-6">{children}</main>
    </div>
  )
}
