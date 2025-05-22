"use client"

import { useState, useEffect } from "react"
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns"
import { SessionTemplate } from "@/types/session"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileCalendarView } from "./mobile-calendar-view"
import { MobileSessionList } from "./mobile-session-list"

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

interface BookingCalendarProps {
  sessions: SessionTemplate[]
}

export function BookingCalendar({ sessions }: BookingCalendarProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [currentView, setCurrentView] = useState<View>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Update view based on screen size
  useEffect(() => {
    setCurrentView(isMobile ? 'day' : 'week')
  }, [isMobile])

  // Convert sessions to events format for react-big-calendar
  const events = sessions.flatMap((template): CalendarEvent[] => {
    // For templates with instances, use those directly
    if (template.instances && template.instances.length > 0) {
      return template.instances.map(instance => ({
        id: instance.id,
        title: template.name,
        start: new Date(instance.start_time),
        end: new Date(instance.end_time),
        resource: template
      }))
    }
    
    // For recurring templates without instances, use the schedules to create events
    if (template.is_recurring && template.schedules) {
      const scheduleEvents: CalendarEvent[] = []
      
      template.schedules.forEach(schedule => {
        schedule.days.forEach(day => {
          const [hours, minutes] = schedule.time.split(':').map(Number)
          
          // Create events for each occurrence within the date range
          let currentDate = new Date()
          const endDate = new Date()
          endDate.setMonth(endDate.getMonth() + 3) // Show next 3 months
          
          while (currentDate <= endDate) {
            // Check if this day matches the schedule day
            const currentDay = format(currentDate, 'EEEE').toLowerCase()
            const scheduleDay = day.toLowerCase()
            
            if (currentDay === scheduleDay) {
              const eventDate = new Date(currentDate)
              eventDate.setHours(hours, minutes, 0, 0)
              
              // Create end time
              const endDate = new Date(eventDate)
              endDate.setMinutes(endDate.getMinutes() + template.duration_minutes)
              
              scheduleEvents.push({
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
        })
      })
      
      return scheduleEvents
    }
    
    return []
  })

  const handleSelectEvent = (event: any) => {
    // Navigate to the booking form for this session
    router.push(`/booking/${event.resource.id}?start=${event.start.toISOString()}`)
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
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setCurrentDate(date)
  }

  // For mobile view
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)]">
        <MobileCalendarView
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          sessions={sessions}
        />
        <div className="flex-1 overflow-y-auto">
          <MobileSessionList
            sessions={sessions}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    )
  }

  // For desktop view
  return (
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
            className: 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
          })}
        />
      </div>
    </div>
  )
} 