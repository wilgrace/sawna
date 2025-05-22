import { Suspense } from "react"
import { getSession } from "@/app/actions/session"
import { SessionDetails } from "@/components/booking/session-details"
import { BookingForm } from "@/components/booking/booking-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function SessionPage({
  searchParams,
  params,
}: {
  searchParams: { start?: string }
  params: { sessionId: string }
}) {
  const start = searchParams?.start ? new Date(searchParams.start) : undefined
  const sessionId = params?.sessionId

  const { data: session, error } = await getSession(sessionId)

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertTitle>Session Not Found</AlertTitle>
          <AlertDescription>The requested session could not be found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <SessionDetails session={session} startTime={start} />
          </Suspense>

          <BookingForm session={session} startTime={start} />
        </div>
      </div>
    </div>
  )
} 