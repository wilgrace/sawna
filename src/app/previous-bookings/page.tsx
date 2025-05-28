import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { UpcomingBookings } from "@/components/booking/upcoming-bookings"
import { getUserUpcomingBookings } from "@/app/actions/session"

export default async function PreviousBookingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const { data: bookings, error } = await getUserUpcomingBookings(userId)

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">Error loading bookings: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Bookings</h1>
      
      <div className="grid gap-8">
        <UpcomingBookings bookings={bookings || []} />
      </div>
    </div>
  )
} 