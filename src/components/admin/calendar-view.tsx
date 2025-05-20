"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { List, LayoutGrid, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns"
import { SessionTemplate } from "@/types/session"
import { cn } from "@/lib/utils"

interface CalendarViewProps {
  sessions: SessionTemplate[]
  onEditSession: (session: SessionTemplate) => void
}

export function CalendarView({ sessions, onEditSession }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid" | "calendar">("calendar")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getNextInstance = (template: SessionTemplate) => {
    if (template.instances && template.instances.length > 0) {
      return template.instances[0]
    }
    if (template.schedules && template.schedules.length > 0) {
      // For schedules, we'll create a temporary instance with start_time
      const now = new Date()
      const [hours, minutes] = template.schedules[0].time.split(':').map(Number)
      now.setHours(hours, minutes, 0, 0)
      return {
        id: 'temp',
        start_time: now.toISOString(),
        end_time: new Date(now.getTime() + template.duration_minutes * 60000).toISOString()
      }
    }
    return null
  }

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(template => {
      if (template.instances) {
        return template.instances.some(instance => {
          const instanceDate = new Date(instance.start_time)
          return instanceDate.toDateString() === date.toDateString()
        })
      }
      if (template.schedules) {
        return template.schedules.some(schedule => {
          const dayOfWeek = format(date, 'EEE').toLowerCase()
          return schedule.days.includes(dayOfWeek)
        })
      }
      return false
    })
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="icon" 
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "grid" ? "default" : "outline"} 
            size="icon" 
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "calendar" ? "default" : "outline"} 
            size="icon" 
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            {days.map((day, dayIdx) => {
              const sessions = getSessionsForDate(day)
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[100px] bg-white p-2",
                    !isSameMonth(day, currentMonth) && "bg-gray-50 text-gray-400",
                    isToday(day) && "bg-blue-50"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className={cn(
                      "text-sm",
                      isToday(day) && "font-bold text-blue-600"
                    )}>
                      {format(day, "d")}
                    </span>
                    {sessions.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {sessions.length} session{sessions.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {sessions.map((template) => (
                      <div
                        key={template.id}
                        className="text-xs p-1 rounded bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                        onClick={() => onEditSession(template)}
                      >
                        {template.name}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Next Occurrence</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((template) => {
                const nextInstance = getNextInstance(template)
                return (
                  <TableRow
                    key={template.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onEditSession(template)}
                  >
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      {nextInstance ? format(new Date(nextInstance.start_time), "PPP") : "No upcoming sessions"}
                    </TableCell>
                    <TableCell>{nextInstance ? format(new Date(nextInstance.start_time), "HH:mm") : "N/A"}</TableCell>
                    <TableCell>{template.capacity}</TableCell>
                    <TableCell>
                      <Badge variant={template.is_open ? "success" : "secondary"}>
                        {template.is_open ? "Open" : "Closed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((template) => {
            const nextInstance = getNextInstance(template)
            return (
              <div
                key={template.id}
                className="border rounded-lg p-4 cursor-pointer hover:shadow-md"
                onClick={() => onEditSession(template)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{template.name}</h3>
                  <Badge variant={template.is_open ? "success" : "secondary"}>
                    {template.is_open ? "Open" : "Closed"}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>
                    {nextInstance 
                      ? `${format(new Date(nextInstance.start_time), "PPP")} at ${format(new Date(nextInstance.start_time), "HH:mm")}`
                      : "No upcoming sessions"}
                  </p>
                  <p className="mt-1">Capacity: {template.capacity}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
