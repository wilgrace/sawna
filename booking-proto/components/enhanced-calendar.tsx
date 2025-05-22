"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Calendar, Views, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { format, addDays, startOfMonth, isSameDay, isPast, isToday } from "date-fns"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMobile } from "@/hooks/use-mobile"
import { SessionList } from "@/components/session-list"
import { MobileCalendarView } from "@/components/mobile-calendar-view"

import "react-big-calendar/lib/css/react-big-calendar.css"

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment)

// Types for our sessions
export interface Session {
  id: string
  title: string
  start: Date
  end: Date
  price: number
  capacity: number
  booked: number
  type: "communal" | "private" | "event"
}

// Generate mock data for our calendar
const generateMockSessions = (startDate: Date, days = 30): Session[] => {
  const sessions = []
  const sessionTypes = ["communal", "private", "event"]

  // Generate sessions for past dates too (7 days in the past)
  const startDateWithPast = new Date(startDate)
  startDateWithPast.setDate(startDateWithPast.getDate() - 7)

  for (let i = 0; i < days + 7; i++) {
    const day = addDays(startDateWithPast, i)
    const numSessions = Math.floor(Math.random() * 3) + 1 // 1-3 sessions per day

    for (let j = 0; j < numSessions; j++) {
      const hour = 10 + j * 3 // Sessions at 10am, 1pm, 4pm
      const type = sessionTypes[Math.floor(Math.random() * sessionTypes.length)] as "communal" | "private" | "event"
      const capacity = type === "private" ? 1 : type === "event" ? 30 : 10
      const booked =
        type === "private"
          ? Math.random() > 0.3
            ? 1
            : 0 // 70% chance of being booked
          : Math.floor(Math.random() * (capacity + 1)) // Random number of bookings

      const start = new Date(day)
      start.setHours(hour, 0, 0, 0)

      const end = new Date(day)
      end.setHours(hour + 2, 0, 0, 0)

      sessions.push({
        id: `session-${i}-${j}`,
        title: type === "communal" ? "Communal Session" : type === "private" ? "Private Session" : "Special Event",
        start,
        end,
        price: type === "communal" ? 15 : type === "private" ? 80 : 25,
        capacity,
        booked,
        type,
      })
    }
  }

  return sessions
}

// Helper function to check if a session is in the past
export const isSessionPast = (session: Session): boolean => {
  // Consider a session in the past if its end time is before now
  return isPast(session.end) && !isToday(session.end)
}

// Helper function to get availability status and color
export const getAvailabilityInfo = (session: Session) => {
  // Don't show availability for past sessions
  if (isSessionPast(session)) {
    return { text: "Past", color: "bg-gray-100 text-gray-400" }
  }

  if (session.type === "private") {
    return {
      text: session.booked === 0 ? "Available" : "Booked",
      color: session.booked === 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800",
    }
  }

  const available = session.capacity - session.booked
  const availabilityPercentage = (available / session.capacity) * 100

  if (available === 0) {
    return { text: "Sold out", color: "bg-gray-100 text-gray-800" }
  } else if (availabilityPercentage < 25) {
    return { text: `${available} spot${available === 1 ? "" : "s"} left`, color: "bg-red-100 text-red-800" }
  } else if (availabilityPercentage < 50) {
    return { text: `${available} spots left`, color: "bg-yellow-100 text-yellow-800" }
  } else {
    return { text: `${available} spots left`, color: "bg-green-100 text-green-800" }
  }
}

export function EnhancedCalendar() {
  const router = useRouter()
  const isMobile = useMobile()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState(isMobile ? Views.DAY : Views.WEEK)
  const [isScrolling, setIsScrolling] = useState(false)

  // Generate sessions for the current month and the next month
  const startDate = startOfMonth(currentDate)
  const sessions = useMemo(() => generateMockSessions(startDate, 60), [startDate.toISOString()])

  // Update view based on screen size
  useEffect(() => {
    setView(isMobile ? Views.DAY : Views.WEEK)
  }, [isMobile])

  // Filter sessions for the selected date and future dates
  const filteredSessions = useMemo(() => {
    return sessions
      .filter((session) => session.start >= selectedDate || isSameDay(session.start, selectedDate))
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [sessions, selectedDate])

  // Handle visible date change from scrolling
  const handleVisibleDateChange = useCallback(
    (date: Date) => {
      // Only update if we're not already in a programmatic scroll
      if (!isScrolling) {
        setIsScrolling(true)
        setSelectedDate(date)
        // Reset the scrolling flag after a short delay
        setTimeout(() => setIsScrolling(false), 100)
      }
    },
    [isScrolling],
  )

  // Handle date selection from the calendar
  const handleDateSelect = useCallback((date: Date) => {
    setIsScrolling(true)
    setSelectedDate(date)
    // Reset the scrolling flag after a short delay
    setTimeout(() => setIsScrolling(false), 100)
  }, [])

  const handleSessionClick = (sessionId: string) => {
    // Find the session
    const session = sessions.find((s) => s.id === sessionId)

    // Don't navigate if the session is in the past
    if (session && isSessionPast(session)) {
      return
    }

    router.push(`/booking/${sessionId}`)
  }

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    if (action === "PREV") {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        if (view === Views.MONTH) {
          newDate.setMonth(prev.getMonth() - 1)
        } else if (view === Views.WEEK) {
          newDate.setDate(prev.getDate() - 7)
        } else {
          newDate.setDate(prev.getDate() - 1)
        }
        return newDate
      })
    } else if (action === "NEXT") {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        if (view === Views.MONTH) {
          newDate.setMonth(prev.getMonth() + 1)
        } else if (view === Views.WEEK) {
          newDate.setDate(prev.getDate() + 7)
        } else {
          newDate.setDate(prev.getDate() + 1)
        }
        return newDate
      })
    } else {
      setCurrentDate(new Date())
    }
  }

  // Get view name for display
  const getViewName = () => {
    switch (view) {
      case Views.DAY:
        return "Day"
      case Views.WEEK:
        return "Week"
      case Views.MONTH:
        return "Month"
      default:
        return "Week"
    }
  }

  // For desktop view
  if (!isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-4xl font-bold">
            {format(currentDate, view === Views.MONTH ? "MMMM yyyy" : "MMMM yyyy")}
          </h2>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px] justify-between">
                  {getViewName()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setView(Views.DAY)}>Day</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView(Views.WEEK)}>Week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView(Views.MONTH)}>Month</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => handleNavigate("TODAY")}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleNavigate("PREV")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleNavigate("NEXT")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={sessions}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date)}
            onSelectEvent={(event) => handleSessionClick(event.id)}
            onSelectSlot={({ start }) => setSelectedDate(new Date(start))}
            selectable
            components={{
              toolbar: () => null, // Hide the default toolbar
              event: ({ event }) => {
                const session = event as unknown as Session
                const isPastSession = isSessionPast(session)
                const availabilityInfo = getAvailabilityInfo(session)

                // Apply different styles for past sessions
                const pastSessionClass = isPastSession ? "opacity-60 cursor-default" : "cursor-pointer"

                // Different layouts based on view type
                if (view === Views.MONTH) {
                  return (
                    <div className={`text-xs p-1 overflow-hidden h-full ${pastSessionClass}`}>
                      <div className="font-medium truncate">{session.title}</div>
                      {!isPastSession && <div className="truncate">${session.price}</div>}
                    </div>
                  )
                }

                return (
                  <div className={`p-1 overflow-hidden text-xs h-full ${pastSessionClass}`}>
                    <div className="font-medium">{session.title}</div>
                    {!isPastSession && <div className="mt-0.5">${session.price}</div>}
                    <div className={`mt-1 px-1 rounded-sm inline-block ${availabilityInfo.color}`}>
                      {availabilityInfo.text}
                    </div>
                  </div>
                )
              },
            }}
          />
        </div>
      </div>
    )
  }

  // For mobile view (Fantastical-style)
  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <MobileCalendarView
        currentDate={currentDate}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        sessions={sessions}
      />

      <div className="flex-1 overflow-y-auto">
        <SessionList
          sessions={filteredSessions}
          onSessionClick={handleSessionClick}
          onVisibleDateChange={handleVisibleDateChange}
        />
      </div>
    </div>
  )
}
