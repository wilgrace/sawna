"use client"

import { useRef, useEffect, useState } from "react"
import { format, isSameDay, parseISO } from "date-fns"
import { type Session, getAvailabilityInfo, isSessionPast } from "./enhanced-calendar"

interface SessionListProps {
  sessions: Session[]
  onSessionClick: (sessionId: string) => void
  onVisibleDateChange?: (date: Date) => void
}

export function SessionList({ sessions, onSessionClick, onVisibleDateChange }: SessionListProps) {
  const dateHeaderRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [visibleDateKey, setVisibleDateKey] = useState<string | null>(null)

  useEffect(() => {
    // Skip if no callback is provided
    if (!onVisibleDateChange) return

    // Create an intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible date header with the highest intersection ratio
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)

        if (visibleEntries.length > 0) {
          // Sort by intersection ratio (highest first) and Y position (top first)
          const sortedEntries = visibleEntries.sort((a, b) => {
            // If intersection ratios are significantly different, use that
            if (Math.abs(b.intersectionRatio - a.intersectionRatio) > 0.1) {
              return b.intersectionRatio - a.intersectionRatio
            }
            // Otherwise, prefer the one closer to the top
            return a.boundingClientRect.y - b.boundingClientRect.y
          })

          const dateKey = sortedEntries[0].target.getAttribute("data-date")
          if (dateKey && dateKey !== visibleDateKey) {
            setVisibleDateKey(dateKey)
            onVisibleDateChange(parseISO(dateKey))
          }
        }
      },
      {
        root: null, // viewport
        rootMargin: "-80px 0px -60% 0px", // Adjust top margin to account for the fixed header
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      },
    )

    // Observe all date headers
    Object.entries(dateHeaderRefs.current).forEach(([dateKey, element]) => {
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [onVisibleDateChange, sessions, visibleDateKey])

  if (sessions.length === 0) {
    return <div className="text-center py-8 text-gray-500">No sessions available for the selected date.</div>
  }

  // Group sessions by date
  const groupedSessions: { [key: string]: Session[] } = {}

  sessions.forEach((session) => {
    const dateKey = format(session.start, "yyyy-MM-dd")
    if (!groupedSessions[dateKey]) {
      groupedSessions[dateKey] = []
    }
    groupedSessions[dateKey].push(session)
  })

  // Helper function to get dot color based on availability
  const getDotColorClass = (session: Session) => {
    // Past sessions always have gray dots
    if (isSessionPast(session)) {
      return "bg-gray-400"
    }

    if (session.type === "private") {
      return session.booked === 0 ? "bg-green-500" : "bg-gray-400"
    }

    const available = session.capacity - session.booked
    const availabilityPercentage = (available / session.capacity) * 100

    if (available === 0) {
      return "bg-gray-400"
    } else if (availabilityPercentage < 25) {
      return "bg-red-500"
    } else if (availabilityPercentage < 50) {
      return "bg-yellow-500"
    } else {
      return "bg-green-500"
    }
  }

  return (
    <div className="space-y-6 mt-4 overflow-y-auto pb-20">
      {Object.entries(groupedSessions).map(([dateKey, dateSessions]) => {
        const date = new Date(dateKey)
        const isToday = isSameDay(date, new Date())

        return (
          <div key={dateKey} className="space-y-2">
            <div
              className="flex justify-between items-center sticky top-0 bg-white py-2 z-10"
              ref={(el) => (dateHeaderRefs.current[dateKey] = el)}
              data-date={dateKey}
            >
              <h3 className="font-bold text-lg">
                {isToday ? "TODAY" : format(date, "EEEE").toUpperCase()} {format(date, "dd/MM/yyyy")}
              </h3>
              <div className="text-sm text-gray-500">{format(date, "d°")}</div>
            </div>

            <div className="space-y-2">
              {dateSessions.map((session) => {
                const isPastSession = isSessionPast(session)
                const availabilityInfo = getAvailabilityInfo(session)
                const dotColorClass = getDotColorClass(session)

                // Apply different styles for past sessions
                const pastSessionClass = isPastSession ? "opacity-60" : ""
                const cursorClass = isPastSession ? "cursor-default" : "cursor-pointer hover:bg-gray-50"

                return (
                  <div
                    key={session.id}
                    className={`flex items-start p-3 rounded-lg ${cursorClass} ${pastSessionClass}`}
                    onClick={() => !isPastSession && onSessionClick(session.id)}
                  >
                    <div className={`w-4 h-4 rounded-full ${dotColorClass} mt-1 mr-3`}></div>
                    <div className="flex-1">
                      <div className="text-gray-600">
                        {format(session.start, "HH:mm")} – {format(session.end, "HH:mm")}
                      </div>
                      <div className="font-medium">{session.title}</div>
                      {!isPastSession && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-600">${session.price}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${availabilityInfo.color}`}>
                            {availabilityInfo.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
