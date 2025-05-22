import { Suspense } from "react"
import { getPublicSessions } from "@/app/actions/session"
import { BookingCalendar } from "@/components/booking/booking-calendar"
import { Skeleton } from "@/components/ui/skeleton"

export default async function BookingPage() {
  const { data: sessions, error } = await getPublicSessions()

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">Error loading sessions: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Book Your Session</h1>
      
      <div className="grid gap-8">
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <BookingCalendar sessions={sessions || []} />
        </Suspense>
      </div>
    </div>
  )
}
