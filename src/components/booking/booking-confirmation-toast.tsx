"use client"

import { CheckCircle, X } from "lucide-react"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

export function BookingConfirmationToast() {
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return
    // Booking confirmation toast
    const data = localStorage.getItem("bookingConfirmation")
    if (data) {
      localStorage.removeItem("bookingConfirmation")
      try {
        const details = JSON.parse(data)
        const dateObj = new Date(details.date)
        const formattedDate = format(dateObj, "HH:mm 'on' EEEE d MMMM")
        const peopleText = details.numberOfSpots === 1 ? "For 1 person" : `For ${details.numberOfSpots} people`
        toast({
          title: "Booking Confirmed!",
          description: (
            <div className="flex items-start gap-2 mt-1">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">{details.sessionName}</div>
                <div>{formattedDate}</div>
                <div>{peopleText}</div>
              </div>
            </div>
          ),
          duration: 4000,
          className: undefined // Use default styles
        })
      } catch (e) {
        // ignore
      }
      return
    }
    // Booking update/delete toast
    const actionData = localStorage.getItem("bookingAction")
    if (actionData) {
      localStorage.removeItem("bookingAction")
      try {
        const details = JSON.parse(actionData)
        const dateObj = new Date(details.date)
        const formattedDate = format(dateObj, "HH:mm 'on' EEEE d MMMM")
        const peopleText = details.numberOfSpots === 1 ? "For 1 person" : `For ${details.numberOfSpots} people`
        let title = ""
        let icon = <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
        if (details.type === "update") {
          title = "Booking Updated!"
        } else if (details.type === "delete") {
          title = "Booking Cancelled!"
          icon = <X className="h-5 w-5 text-red-500 mt-0.5" />
        }
        toast({
          title,
          description: (
            <div className="flex items-start gap-2 mt-1">
              {icon}
              <div>
                <div className="font-medium">{details.sessionName}</div>
                <div>{formattedDate}</div>
                <div>{peopleText}</div>
              </div>
            </div>
          ),
          duration: 4000,
          className: undefined
        })
      } catch (e) {
        // ignore
      }
    }
  }, [toast, router])

  return null
} 