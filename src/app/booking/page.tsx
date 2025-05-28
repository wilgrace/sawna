import { Suspense } from "react"
import { getPublicSessions, getUserUpcomingBookings } from "@/app/actions/session"
import { BookingCalendar } from "@/components/booking/booking-calendar"
import { UpcomingBookings } from "@/components/booking/upcoming-bookings"
import { Skeleton } from "@/components/ui/skeleton"
import { auth } from "@clerk/nextjs/server"

export default async function BookingPage() {
  const { userId } = await auth()
  const { data: sessions, error: sessionsError } = await getPublicSessions()
  const { data: bookings, error: bookingsError } = userId 
    ? await getUserUpcomingBookings(userId)
    : { data: [], error: null }

  if (sessionsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">Error loading sessions: {sessionsError}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">      
      <div className="grid gap-8">
        {userId && <UpcomingBookings bookings={bookings || []} />}
        
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <BookingCalendar sessions={sessions || []} />
        </Suspense>
      </div>
    </div>
  )
}
