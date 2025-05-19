import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { BookingView } from "@/components/booking/booking-view"
import { BookingForm } from "@/components/booking/booking-form"
import { AdminControls } from "@/components/booking/admin-controls"

export default async function BookingPage() {
  const { userId } = await auth()
  const isAdmin = false // We'll implement admin check later

  return (
    <div className="space-y-6">
      <BookingView />
      
      {userId && (
        <BookingForm />
      )}
      
      {isAdmin && (
        <AdminControls />
      )}
    </div>
  )
}
