"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { SessionTemplate } from "@/types/session"
import { useUser } from "@clerk/nextjs"
import { createBooking, updateBooking, deleteBooking } from "@/app/actions/session"
import { getClerkUser } from "@/app/actions/clerk"
import { createClerkUser } from "@/app/actions/clerk"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BookingFormProps {
  session: SessionTemplate
  startTime?: Date
  bookingDetails?: {
    id: string
    notes?: string
    number_of_spots: number
  }
}

export function BookingForm({ session, startTime, bookingDetails }: BookingFormProps) {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState(bookingDetails?.notes || "")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [numberOfSpots, setNumberOfSpots] = useState(bookingDetails?.number_of_spots || 1)
  const [isEditMode, setIsEditMode] = useState(!!bookingDetails)
  const [bookingId, setBookingId] = useState<string | null>(bookingDetails?.id || null)

  useEffect(() => {
    if (bookingDetails) {
      setNotes(bookingDetails.notes || "")
      setNumberOfSpots(bookingDetails.number_of_spots)
      setBookingId(bookingDetails.id)
      setIsEditMode(true)
    }
  }, [bookingDetails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startTime) {
      toast({
        title: "Error",
        description: "Please select a session time",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let clerkUserId: string

      if (!user) {
        // For non-logged in users, create a new clerk user
        const result = await createClerkUser({
          email: email,
          first_name: name.split(" ")[0],
          last_name: name.split(" ").slice(1).join(" ")
        })

        if (!result.success || !result.id) {
          console.error("Error creating guest user:", result.error)
          throw new Error(`Failed to create guest user: ${result.error}`)
        }

        clerkUserId = result.id
        console.log("Created or found guest user with ID:", clerkUserId)
      } else {
        // For logged in users, get or create their clerk user record
        const clerkUserResult = await getClerkUser(user.id)

        if (!clerkUserResult.success) {
          console.error("Error getting clerk user:", clerkUserResult.error)
          throw new Error(`Failed to get clerk user: ${clerkUserResult.error}`)
        }

        if (!clerkUserResult.id) {
          console.log("No clerk user found, creating one...")
          // Create the user using the server action
          const result = await createClerkUser({
            email: user.emailAddresses[0].emailAddress,
            first_name: user.firstName || undefined,
            last_name: user.lastName || undefined
          })

          if (!result.success || !result.id) {
            console.error("Error creating clerk user:", result.error)
            throw new Error(`Failed to create clerk user: ${result.error}`)
          }

          clerkUserId = result.id
          console.log("Created new clerk user with ID:", clerkUserId)
        } else {
          clerkUserId = clerkUserResult.id
          console.log("Using existing clerk user with ID:", clerkUserId)
        }
      }

      if (isEditMode && bookingId) {
        // Update existing booking
        const result = await updateBooking({
          booking_id: bookingId,
          notes: notes || undefined,
          number_of_spots: numberOfSpots
        })

        if (!result.success) {
          throw new Error(result.error || "Failed to update booking")
        }

        toast({
          title: "Success",
          description: "Booking updated successfully",
        })
      } else {
        // Create new booking
        const result = await createBooking({
          session_template_id: session.id,
          user_id: clerkUserId,
          start_time: startTime.toISOString(),
          notes: notes || undefined,
          number_of_spots: numberOfSpots
        })

        if (!result.success) {
          throw new Error(result.error || "Failed to create booking")
        }

        toast({
          title: "Success",
          description: "Session booked successfully",
        })
      }
      
      router.push("/booking/confirmation")
    } catch (error: any) {
      console.error("Error managing booking:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to manage booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!bookingId) return

    setLoading(true)
    try {
      const result = await deleteBooking(bookingId)

      if (!result.success) {
        throw new Error(result.error || "Failed to cancel booking")
      }

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      })
      router.push("/booking")
    } catch (error: any) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Modify Booking" : "Book This Session"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={user ? user.fullName || "" : name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!user}
              placeholder={user ? "" : "Enter your name"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user ? user.primaryEmailAddress?.emailAddress || "" : email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!user}
              placeholder={user ? "" : "Enter your email"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or requirements?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfSpots">Number of Spots</Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setNumberOfSpots(Math.max(1, numberOfSpots - 1))}
                disabled={numberOfSpots <= 1}
              >
                -
              </Button>
              <div className="w-12 text-center font-medium">{numberOfSpots}</div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setNumberOfSpots(Math.min(session.capacity, numberOfSpots + 1))}
                disabled={numberOfSpots >= session.capacity}
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !startTime || (!user && (!name || !email))}
            >
              {loading ? "Saving..." : isEditMode ? "Update Booking" : "Book Now"}
            </Button>

            {isEditMode && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    disabled={loading}
                  >
                    Cancel Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently cancel your booking.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, keep booking</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>
                      Yes, cancel booking
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
