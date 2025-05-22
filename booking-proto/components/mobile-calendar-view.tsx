"use client"

import { useState, useEffect } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
} from "date-fns"
import type { Session } from "./enhanced-calendar"

interface MobileCalendarViewProps {
  currentDate: Date
  selectedDate: Date
  onDateSelect: (date: Date) => void
  sessions: Session[]
}

export function MobileCalendarView({ currentDate, selectedDate, onDateSelect, sessions }: MobileCalendarViewProps) {
  const [viewDate, setViewDate] = useState(currentDate)

  // Update view month when selected date changes to a different month
  useEffect(() => {
    if (!isSameMonth(selectedDate, viewDate)) {
      setViewDate(selectedDate)
    }
  }, [selectedDate, viewDate])

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get the day names for the header
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

  // Navigate to previous/next month
  const prevMonth = () => setViewDate(subMonths(viewDate, 1))
  const nextMonth = () => setViewDate(addMonths(viewDate, 1))

  // Get sessions for a specific day
  const getSessionsForDay = (day: Date) => {
    return sessions.filter((session) => isSameDay(session.start, day))
  }

  // Generate color dots for sessions
  const renderSessionDots = (day: Date) => {
    const daySessions = getSessionsForDay(day)
    if (daySessions.length === 0) return null

    // Limit to 4 dots
    const displaySessions = daySessions.slice(0, 4)

    return (
      <div className="flex justify-center mt-1 space-x-0.5">
        {displaySessions.map((session, index) => {
          let dotColor = "bg-gray-400"

          if (session.type === "communal") dotColor = "bg-blue-500"
          else if (session.type === "private") dotColor = "bg-orange-500"
          else if (session.type === "event") dotColor = "bg-red-500"

          return <div key={index} className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        })}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm sticky top-0 z-10">
      {/* Month title */}
      <div className="flex items-center justify-center p-4 border-b">
        <h2 className="text-2xl font-bold">
          <span>
            {format(viewDate, "MMMM")} <span className="text-red-500">{format(viewDate, "yyyy")}</span>
          </span>
        </h2>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 text-center text-xs font-medium py-2">
        {dayNames.map((day, i) => (
          <div key={i} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 text-center">
        {daysInMonth.map((day, i) => {
          // Adjust the index to start from Monday (1) instead of Sunday (0)
          const dayOfWeek = day.getDay() === 0 ? 6 : day.getDay() - 1

          // If it's the first day of the month, add appropriate spacing
          const startSpacing = i === 0 ? `col-start-${dayOfWeek + 1}` : ""

          const isSelected = isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, viewDate)

          return (
            <div key={i} className={`py-2 ${startSpacing} ${!isCurrentMonth ? "text-gray-400" : ""}`}>
              <button
                className={`w-10 h-10 flex flex-col items-center justify-center rounded-full ${
                  isSelected ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                }`}
                onClick={() => onDateSelect(day)}
              >
                <span>{format(day, "d")}</span>
              </button>
              {renderSessionDots(day)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
