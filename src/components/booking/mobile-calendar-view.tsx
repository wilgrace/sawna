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
  isPast,
  isToday,
} from "date-fns"
import { SessionTemplate } from "@/types/session"
import { useRouter } from "next/navigation"

interface MobileCalendarViewProps {
  currentDate: Date
  selectedDate: Date
  onDateSelect: (date: Date) => void
  sessions: SessionTemplate[]
}

export function MobileCalendarView({ currentDate, selectedDate, onDateSelect, sessions }: MobileCalendarViewProps) {
  const router = useRouter()
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
    return sessions.filter((template) => {
      // Check if any instance matches this day
      if (template.instances) {
        return template.instances.some(instance => 
          isSameDay(new Date(instance.start_time), day)
        )
      }
      
      // Check if any recurring schedule matches this day
      if (template.is_recurring && template.schedules) {
        const dayName = format(day, 'EEEE').toLowerCase()
        return template.schedules.some(schedule => 
          schedule.days.some(scheduleDay => 
            scheduleDay.toLowerCase() === dayName
          )
        )
      }
      
      return false
    })
  }

  // Generate color dots for sessions
  const renderSessionDots = (day: Date) => {
    const daySessions = getSessionsForDay(day)
    if (daySessions.length === 0) return null

    // Limit to 4 dots
    const displaySessions = daySessions.slice(0, 4)

    return (
      <div className="flex justify-center mt-1 space-x-0.5">
        {displaySessions.map((session, index) => (
          <div key={index} className="h-1.5 w-1.5 rounded-full bg-primary" />
        ))}
      </div>
    )
  }

  const handleDayClick = (day: Date) => {
    onDateSelect(day)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm sticky top-0 z-10">
      {/* Month title */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          ←
        </button>
        <h2 className="text-2xl font-bold">
          <span>
            {format(viewDate, "MMMM")} <span className="text-primary">{format(viewDate, "yyyy")}</span>
          </span>
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          →
        </button>
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
          const isPastDay = isPast(day) && !isToday(day)

          return (
            <div key={i} className={`py-2 ${startSpacing} ${!isCurrentMonth ? "text-gray-400" : ""}`}>
              <button
                className={`w-10 h-10 flex flex-col items-center justify-center rounded-full ${
                  isSelected ? "bg-primary text-white" : 
                  isPastDay ? "text-gray-400" : 
                  "hover:bg-gray-100"
                }`}
                onClick={() => !isPastDay && handleDayClick(day)}
                disabled={isPastDay}
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