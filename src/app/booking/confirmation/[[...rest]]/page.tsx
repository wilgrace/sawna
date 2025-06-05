import { getBookingDetails } from "@/app/actions/session"
import { redirect } from "next/navigation"
import ConfirmationClient from "../ConfirmationClient"

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const bookingId = params.bookingId;
  if (!bookingId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <h1 className="text-2xl font-bold">No Booking Found</h1>
          <p className="text-muted-foreground">Missing booking ID. Please try booking again.</p>
        </div>
      </div>
    )
  }

  // Fetch booking, session, and user details
  const result = await getBookingDetails(bookingId)
  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <h1 className="text-2xl font-bold">No Booking Found</h1>
          <p className="text-muted-foreground">{(result as any).error || "We couldn't find your booking details. Please try booking again."}</p>
        </div>
      </div>
    )
  }

  const { session, startTime, booking } = (result as any).data
  const bookingUser = booking.user
  // If the booking is associated with a real Clerk user, redirect to /booking
  if (bookingUser && bookingUser.clerk_user_id && !bookingUser.clerk_user_id.startsWith("guest_")) {
    redirect("/booking")
  }

  // Prefill Clerk SignUp for guests
  const signUpInitialValues = {
    emailAddress: bookingUser?.email || "",
    firstName: bookingUser?.first_name || "",
    lastName: bookingUser?.last_name || ""
  }

  return (
    <ConfirmationClient
      session={session}
      startTime={startTime}
      signUpInitialValues={signUpInitialValues}
    />
  )
} 