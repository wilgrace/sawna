"use client"

import { useEffect, useState, use } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { SessionDetails } from "@/components/booking/session-details"
import { BookingForm } from "@/components/booking/booking-form"
import { SessionTemplate } from "@/types/session"
import { createClient } from '@supabase/supabase-js'
import { useUser } from "@clerk/nextjs"
import { getBookingDetails } from "@/app/actions/session"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SessionPageProps {
  params: Promise<{
    sessionId: string
  }>
}

export default function SessionPage({ params }: SessionPageProps) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const { user } = useUser()
  const [session, setSession] = useState<SessionTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Get start time from URL if present
        const startParam = searchParams.get('start')
        if (startParam) {
          setStartTime(new Date(startParam))
        }

        // Check if we're in edit mode
        const edit = searchParams.get('edit')
        const bookingId = searchParams.get('bookingId')
        
        console.log("=== Session Page Debug ===")
        console.log("Raw URL Parameters:", {
          sessionId: resolvedParams.sessionId,
          start: startParam,
          edit,
          bookingId,
          fullUrl: window.location.href
        })
        
        if (edit === 'true' && bookingId && user) {
          console.log("Processing edit mode with:", {
            bookingId,
            userId: user.id,
            edit,
            sessionId: resolvedParams.sessionId
          })

          try {
            const result = await getBookingDetails(bookingId)
            if (!result.success || !result.data) {
              throw new Error(result.error || "Failed to fetch booking details")
            }
            const { booking, session, startTime: bookingStartTime } = result.data
            console.log("Successfully fetched booking:", { booking, session })
            
            // Set booking details and session
            setBookingDetails(booking)
            setSession(session as unknown as SessionTemplate)
            setStartTime(bookingStartTime)
            setDebugInfo({
              bookingId,
              userId: user.id
            })
          } catch (error: any) {
            console.error("Error fetching booking details:", error)
            setDebugInfo((prev: any) => ({ 
              ...(prev || {}), 
              error: error.message,
              bookingId,
              userId: user.id
            }))
            throw error
          }
        } else {
          // Fetch session template using the same approach as getBookingDetails
          const { data: sessionData, error: sessionError } = await supabase
            .from('session_templates')
            .select(`
              id,
              name,
              description,
              capacity,
              duration_minutes,
              is_open,
              is_recurring,
              created_at,
              updated_at,
              created_by,
              organization_id
            `)
            .eq('id', resolvedParams.sessionId)
            .single()

          if (sessionError) {
            throw new Error(sessionError.message)
          }

          if (!sessionData) {
            throw new Error("Session template not found")
          }

          setSession(sessionData as unknown as SessionTemplate)
        }
      } catch (err: any) {
        setError(err.message)
        setDebugInfo((prev: any) => ({ ...(prev || {}), error: err.message }))
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [resolvedParams.sessionId, searchParams, user])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading session details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <Link href="/booking">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Calendar
            </Button>
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h2 className="text-red-800 font-semibold mb-2">Error: {error || "Session not found"}</h2>
          {debugInfo && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-red-700 mb-2">Debug Information:</h3>
              <pre className="bg-white border border-red-100 rounded p-4 text-sm overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Link href="/booking">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Calendar
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <SessionDetails session={session} startTime={startTime || undefined} />
        <BookingForm 
          session={session} 
          startTime={startTime || undefined}
          bookingDetails={bookingDetails}
        />
      </div>
    </div>
  )
} 