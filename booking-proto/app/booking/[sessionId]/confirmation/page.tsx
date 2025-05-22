import Link from "next/link"
import { Check, Share2, Calendar, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

// Mock function to fetch booking data
async function getBooking(sessionId: string) {
  // In a real app, this would fetch from your database
  return {
    id: "booking-123",
    sessionId,
    title: "Communal Sauna Session",
    date: "2025-05-25T18:00:00",
    visitors: 2,
    totalPaid: 30,
  }
}

export default async function ConfirmationPage({ params }: { params: { sessionId: string } }) {
  const booking = await getBooking(params.sessionId)

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
        <p className="text-muted-foreground mt-2">Your sauna session has been booked successfully.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg">{booking.title}</h2>
            <p className="text-muted-foreground">
              {new Date(booking.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-muted-foreground">
              {new Date(booking.date).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <span>Visitors</span>
            <span>{booking.visitors}</span>
          </div>

          <div className="flex justify-between font-medium">
            <span>Total Paid</span>
            <span>${booking.totalPaid.toFixed(2)}</span>
          </div>
        </CardContent>
        <CardFooter className="bg-muted p-4 flex justify-between">
          <span className="text-sm">Booking Reference</span>
          <span className="text-sm font-mono">{booking.id}</span>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <Button className="w-full" variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share with Friends
        </Button>

        <Button className="w-full" variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Add to Calendar
        </Button>

        <Link href="/" className="block w-full">
          <Button className="w-full">
            Book Another Session
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
