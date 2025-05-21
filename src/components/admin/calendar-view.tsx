"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { List, ChevronLeft, ChevronRight, Calendar, ChevronDown } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek as dateFnsStartOfWeek, endOfWeek as dateFnsEndOfWeek } from "date-fns"
import { SessionTemplate } from "@/types/session"
import { cn } from "@/lib/utils"
import { useCalendarView } from "@/hooks/use-calendar-view"
import { Calendar as BigCalendar, momentLocalizer, View, Components } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Configure moment to start week on Monday
moment.locale('en', {
  week: {
    dow: 1 // Monday is the first day of the week
  }
})

const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: SessionTemplate
}

interface CalendarViewProps {
  sessions: SessionTemplate[]
  onEditSession: (session: SessionTemplate) => void
  onCreateSession: (start: Date, end: Date) => void
  showControls?: boolean
}

export function CalendarView({ sessions, onEditSession, onCreateSession, showControls = true }: CalendarViewProps) {
  const { view: viewMode } = useCalendarView()
  const [currentView, setCurrentView] = useState<View>('week')
  const [isMobile, setIsMobile] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Debug logging for sessions data
  useEffect(() => {
    console.log("Calendar View - Received sessions:", {
      count: sessions.length,
      sessions: sessions.map(s => ({
        id: s.id,
        name: s.name,
        is_recurring: s.is_recurring,
        schedules: s.schedules,
        instances: s.instances
      }))
    })
  }, [sessions])

  // Handle responsive view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCurrentView('day')
      } else {
        setCurrentView('week')
      }
    }

    // Check on mount
    checkMobile()

    // Add resize listener
    window.addEventListener('resize', checkMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Convert sessions to events format for react-big-calendar
  const events = sessions.flatMap(template => {
    console.log("Processing template for events:", {
      id: template.id,
      name: template.name,
      is_recurring: template.is_recurring,
      schedules: template.schedules,
      instances: template.instances
    })

    // For recurring templates, use the schedules to create events
    if (template.is_recurring && template.schedules) {
      const scheduleEvents = template.schedules.flatMap(schedule => {
        // Calculate the date range based on the current view
        let startDate: Date
        let endDate: Date
        
        switch (currentView) {
          case 'month':
            startDate = startOfMonth(currentDate)
            endDate = endOfMonth(currentDate)
            break
          case 'week':
            startDate = dateFnsStartOfWeek(currentDate, { weekStartsOn: 1 })
            endDate = dateFnsEndOfWeek(currentDate, { weekStartsOn: 1 })
            break
          case 'day':
            startDate = currentDate
            endDate = currentDate
            break
          default:
            startDate = dateFnsStartOfWeek(currentDate, { weekStartsOn: 1 })
            endDate = dateFnsEndOfWeek(currentDate, { weekStartsOn: 1 })
        }
        
        console.log("Creating events for schedule:", {
          schedule,
          view: currentView,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          scheduleDays: schedule.days
        })
        
        // Create events for each day in the schedule
        return schedule.days.map(day => {
          const [hours, minutes] = schedule.time.split(':').map(Number)
          
          // Create events for each occurrence within the date range
          const events: CalendarEvent[] = []
          let currentDate = new Date(startDate)
          
          while (currentDate <= endDate) {
            // Check if this day matches the schedule day
            const currentDay = format(currentDate, 'EEEE').toLowerCase()
            const scheduleDay = day.toLowerCase()
            
            console.log("Comparing days:", {
              currentDay,
              scheduleDay,
              matches: currentDay === scheduleDay,
              currentDate: currentDate.toISOString()
            })
            
            if (currentDay === scheduleDay) {
              const eventDate = new Date(currentDate)
              eventDate.setHours(hours, minutes, 0, 0)
              
              // Create end time
              const endDate = new Date(eventDate)
              endDate.setMinutes(endDate.getMinutes() + template.duration_minutes)
              
              events.push({
                id: `${template.id}-${schedule.id}-${day}-${eventDate.toISOString()}`,
                title: template.name,
                start: eventDate,
                end: endDate,
                resource: template
              })
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1)
          }
          
          console.log(`Created ${events.length} events for ${day}:`, events.map(e => ({
            id: e.id,
            title: e.title,
            start: e.start.toISOString(),
            end: e.end.toISOString(),
            localStart: e.start.toString(),
            localEnd: e.end.toString()
          })))
          
          return events
        })
      })
      
      console.log("Generated events for recurring template:", {
        templateId: template.id,
        eventCount: scheduleEvents.length,
        events: scheduleEvents.flat().map(e => ({
          id: e.id,
          title: e.title,
          start: e.start.toISOString(),
          end: e.end.toISOString(),
          localStart: e.start.toString(),
          localEnd: e.end.toString()
        }))
      })
      
      return scheduleEvents.flat()
    }
    
    // For one-off templates, use the instances
    if (template.instances && template.instances.length > 0) {
      const instanceEvents = template.instances.map(instance => {
        const start = new Date(instance.start_time)
        const end = new Date(instance.end_time)
        
        return {
          id: instance.id,
          title: template.name,
          start,
          end,
          resource: template
        }
      })
      
      console.log("Generated events for one-off template:", {
        templateId: template.id,
        eventCount: instanceEvents.length,
        events: instanceEvents.map(e => ({
          id: e.id,
          title: e.title,
          start: e.start.toISOString(),
          end: e.end.toISOString(),
          localStart: e.start.toString(),
          localEnd: e.end.toString()
        }))
      })
      
      return instanceEvents
    }
    
    // If no instances or schedules exist, create a placeholder event
    const placeholderEvent = {
      id: template.id,
      title: template.name,
      start: new Date(),
      end: new Date(new Date().getTime() + template.duration_minutes * 60000),
      resource: template
    }
    
    console.log("Created placeholder event:", {
      templateId: template.id,
      event: {
        ...placeholderEvent,
        localStart: placeholderEvent.start.toString(),
        localEnd: placeholderEvent.end.toString()
      }
    })
    
    return [placeholderEvent]
  })

  console.log("Final events array:", {
    count: events.length,
    events: events.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      localStart: e.start.toString(),
      localEnd: e.end.toString()
    }))
  })

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    onCreateSession(start, end)
  }

  const handleSelectEvent = (event: any) => {
    onEditSession(event.resource)
  }

  const navigatePeriod = (direction: 'prev' | 'next') => {
    switch (currentView) {
      case 'month':
        setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
        break
      case 'week':
        setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
        break
      case 'day':
        setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1))
        break
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Custom components for the calendar
  const components: Components = {
    toolbar: () => null, // Remove the default toolbar
    header: ({ date, label }) => {
      if (currentView === 'month') {
        return <div className="rbc-header">{label}</div>
      }
      if (currentView === 'day') {
        return (
          <div className="rbc-header">
            <div className="text-lg font-semibold mb-2">{format(date, 'EEEE, MMMM d, yyyy')}</div>
            {label}
          </div>
        )
      }
      return <div className="rbc-header">{label}</div>
    }
  }

  return (
    <div className="space-y-6">
      {viewMode === "calendar" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCurrentView('month')}>
                    Month
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('week')}>
                    Week
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('day')}>
                    Day
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigatePeriod('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigatePeriod('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="h-[600px] border rounded-lg">
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              step={30}
              timeslots={2}
              min={new Date(0, 0, 0, 8, 0, 0)} // 8 AM
              max={new Date(0, 0, 0, 20, 0, 0)} // 8 PM
              eventPropGetter={(event) => ({
                className: 'bg-primary text-primary-foreground hover:bg-primary/90'
              })}
              components={components}
              defaultView="week"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session Template</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((template) => (
                <TableRow
                  key={template.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onEditSession(template)}
                >
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    {template.schedules && template.schedules.length > 0 ? (
                      <div className="text-sm">
                        {template.schedules.map((schedule, idx) => (
                          <div key={idx}>
                            {schedule.days.join(', ')} at {schedule.time}
                          </div>
                        ))}
                      </div>
                    ) : template.instances && template.instances.length > 0 ? (
                      "One-time sessions"
                    ) : (
                      "No schedule"
                    )}
                  </TableCell>
                  <TableCell>{template.duration_minutes} minutes</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// Export the ViewToggle component
CalendarView.Toggle = function ViewToggle() {
  const { view, setView } = useCalendarView()
  
  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant={view === "list" ? "default" : "outline"} 
        size="icon" 
        onClick={() => setView("list")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button 
        variant={view === "calendar" ? "default" : "outline"} 
        size="icon" 
        onClick={() => setView("calendar")}
      >
        <Calendar className="h-4 w-4" />
      </Button>
    </div>
  )
}
