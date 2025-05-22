"use client"

import { format, isSameDay } from "date-fns"
import { SessionTemplate } from "@/types/session"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface MobileSessionListProps {
  sessions: SessionTemplate[]
  selectedDate: Date
}

export function MobileSessionList({ sessions, selectedDate }: MobileSessionListProps) {
  const router = useRouter()

  // Filter sessions for the selected date
  const filteredSessions = sessions.filter((template) => {
    // Check if any instance matches this day
    if (template.instances) {
      return template.instances.some(instance => 
        isSameDay(new Date(instance.start_time), selectedDate)
      )
    }
    
    // Check if any recurring schedule matches this day
    if (template.is_recurring && template.schedules) {
      const dayName = format(selectedDate, 'EEEE').toLowerCase()
      return template.schedules.some(schedule => 
        schedule.days.some(scheduleDay => 
          scheduleDay.toLowerCase() === dayName
        )
      )
    }
    
    return false
  })

  const handleSessionClick = (template: SessionTemplate, startTime: Date) => {
    router.push(`/booking/${template.id}?start=${startTime.toISOString()}`)
  }

  if (filteredSessions.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No sessions available for this day
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {filteredSessions.map((template) => {
        // Get all instances for this day
        const dayInstances = template.instances?.filter(instance => 
          isSameDay(new Date(instance.start_time), selectedDate)
        ) || []

        // If no instances, create one from the schedule
        if (dayInstances.length === 0 && template.is_recurring && template.schedules) {
          const dayName = format(selectedDate, 'EEEE').toLowerCase()
          const schedule = template.schedules.find(s => 
            s.days.some(d => d.toLowerCase() === dayName)
          )
          
          if (schedule) {
            const [hours, minutes] = schedule.time.split(':').map(Number)
            const startTime = new Date(selectedDate)
            startTime.setHours(hours, minutes, 0, 0)
            
            return (
              <Card key={`${template.id}-${startTime.toISOString()}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(startTime, "h:mm a")}
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => handleSessionClick(template, startTime)}
                    >
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          }
        }

        // Render each instance
        return dayInstances.map(instance => {
          const startTime = new Date(instance.start_time)
          return (
            <Card key={instance.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(startTime, "h:mm a")}
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => handleSessionClick(template, startTime)}
                  >
                    Book
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })
      })}
    </div>
  )
} 