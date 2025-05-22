import { Suspense } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { BookingForm } from "@/components/booking-form"
import { SessionDetails } from "@/components/session-details"
import { Skeleton } from "@/components/ui/skeleton"

// Mock function to fetch session data
async function getSession(id: string) {
  // In a real app, this would fetch from your database
  return {
    id,
    title: "Communal Sauna Session",
    description: "Enjoy our traditional Finnish sauna with up to 8 other guests.",
    date: "2025-05-25T18:00:00",
    image: "/placeholder.svg?height=300&width=500",
    price: {
      communal: 15,
      private: 80,
    },
  }
}

export default async function BookingPage({ params }: { params: { sessionId: string } }) {
  const session = await getSession(params.sessionId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Calendar
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6 md:hidden">Book Your Session</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <SessionDetails session={session} />
        </Suspense>

        <BookingForm session={session} />
      </div>
    </div>
  )
}
