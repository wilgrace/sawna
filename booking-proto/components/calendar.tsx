"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Mock data for available sessions
const generateMockSessions = (startDate: Date) => {
  const sessions = []

  for (let i = 0; i < 7; i++) {
    const day = addDays(startDate, i)
    const numSessions = Math.floor(Math.random() * 3) + 1 // 1-3 sessions per day

    for (let j = 0; j < numSessions; j++) {
      const hour = 12 + j * 3 // Sessions at 12pm, 3pm, 6pm
      sessions.push({
        id: `session-${i}-${j}`,
        title: j === 0 ? "Communal Session" : j === 1 ? "Private Session" : "Special Event",
        date: new Date(day.setHours(hour, 0, 0, 0)),
        available: Math.random() > 0.2, // 80% chance of being available
      })
    }
  }

  return sessions
}

export function Calendar() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Week starts on Monday

  const sessions = generateMockSessions(weekStart)

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1))

  const handleSessionClick = (sessionId: string) => {
    router.push(`/booking/${sessionId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{format(weekStart, "MMMM yyyy")}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = addDays(weekStart, i)
          return (
            <div key={i} className="py-2">
              <div>{format(day, "EEE")}</div>
              <div>{format(day, "d")}</div>
            </div>
          )
        })}
      </div>

      <div className="space-y-6">
        {sessions.map((session) => (
          <Card
            key={session.id}
            className={`cursor-pointer transition-colors ${!session.available ? "opacity-50" : "hover:bg-muted"}`}
            onClick={() => session.available && handleSessionClick(session.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">{format(session.date, "EEEE, MMMM d")}</p>
                  <p className="text-sm text-muted-foreground">{format(session.date, "h:mm a")}</p>
                </div>
                <Button variant="outline" disabled={!session.available}>
                  {session.available ? "Book" : "Unavailable"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
