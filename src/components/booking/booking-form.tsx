"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { SessionTemplate } from "@/types/session"
import { useUser } from "@clerk/nextjs"
import { createBooking } from "@/app/actions/session"
import { getClerkUser } from "@/app/actions/clerk"
import { createClerkUser } from "@/app/actions/clerk"

interface BookingFormProps {
  session: SessionTemplate
  startTime?: Date
}

export function BookingForm({ session, startTime }: BookingFormProps) {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [numberOfSpots, setNumberOfSpots] = useState(1)

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
          clerk_user_id: "guest_" + email, // Use email as part of the ID to ensure uniqueness
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
            clerk_user_id: user.id,
            email: user.emailAddresses[0].emailAddress,
            first_name: user.firstName,
            last_name: user.lastName
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
      router.push("/booking/confirmation")
    } catch (error: any) {
      console.error("Error booking session:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to book session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book This Session</CardTitle>
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

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !startTime || (!user && (!name || !email))}
          >
            {loading ? "Booking..." : "Book Now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
