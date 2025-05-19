"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Plus, X, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface SessionFormProps {
  open: boolean
  onClose: () => void
  template?: any
  onSuccess?: () => void
}

interface ScheduleItem {
  id: string
  time: string
  days: string[]
}

const daysOfWeek = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
]

export function SessionForm({ open, onClose, template, onSuccess }: SessionFormProps) {
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isOpen, setIsOpen] = useState(template?.is_open ?? true)
  const [scheduleType, setScheduleType] = useState(template?.is_recurring ? "repeat" : "once")
  const [duration, setDuration] = useState(template?.duration || "01:15")
  const [name, setName] = useState(template?.name || "")
  const [description, setDescription] = useState(template?.description || "")
  const [capacity, setCapacity] = useState(template?.capacity?.toString() || "10")
  const [schedules, setSchedules] = useState<ScheduleItem[]>(
    template?.schedules || [{ id: "1", time: "09:00", days: ["mon", "thu", "fri"] }]
  )
  const [generalExpanded, setGeneralExpanded] = useState(true)
  const [scheduleExpanded, setScheduleExpanded] = useState(true)

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || "")
      setCapacity(template.capacity.toString())
      setDuration(template.duration)
      setIsOpen(template.is_open)
      if (template.schedules) {
        setSchedules(template.schedules.map((s: any) => ({
          id: s.id,
          time: s.time,
          days: s.days
        })))
      }
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to create a session")
      }

      if (template) {
        // Update existing template
        const { error: templateError } = await supabase
          .from("session_templates")
          .update({
            name,
            description,
            capacity: parseInt(capacity),
            duration,
            is_open: isOpen,
            updated_at: new Date().toISOString(),
          })
          .eq("id", template.id)

        if (templateError) throw templateError

        // Delete existing schedules
        const { error: deleteError } = await supabase
          .from("session_schedules")
          .delete()
          .eq("template_id", template.id)

        if (deleteError) throw deleteError

        // Delete existing instances if switching to recurring
        if (scheduleType === "repeat") {
          const { error: deleteInstancesError } = await supabase
            .from("session_instances")
            .delete()
            .eq("template_id", template.id)

          if (deleteInstancesError) throw deleteInstancesError
        }
      } else {
        // Create new template
        const { data: templateData, error: templateError } = await supabase
          .from("session_templates")
          .insert({
            name,
            description,
            capacity: parseInt(capacity),
            duration,
            is_open: isOpen,
            created_by: user.id,
          })
          .select()
          .single()

        if (templateError) throw templateError

        if (scheduleType === "once" && date) {
          // Create single instance
          const { error: instanceError } = await supabase
            .from("session_instances")
            .insert({
              template_id: templateData.id,
              date: date.toISOString(),
              time: schedules[0].time,
            })

          if (instanceError) throw instanceError
        } else {
          // Create recurring schedules
          const schedulePromises = schedules.map((schedule) =>
            supabase.from("session_schedules").insert({
              template_id: templateData.id,
              time: schedule.time,
              days: schedule.days,
            })
          )

          await Promise.all(schedulePromises)
        }
      }

      toast({
        title: "Success",
        description: template ? "Session updated successfully" : "Session created successfully",
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Error saving session:", error)
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addSchedule = () => {
    const newId = (schedules.length + 1).toString()
    setSchedules([...schedules, { id: newId, time: "09:00", days: [] }])
  }

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== id))
  }

  const updateScheduleTime = (id: string, time: string) => {
    setSchedules(schedules.map((schedule) => (schedule.id === id ? { ...schedule, time } : schedule)))
  }

  const toggleDay = (scheduleId: string, day: string) => {
    setSchedules(
      schedules.map((schedule) => {
        if (schedule.id === scheduleId) {
          const newDays = schedule.days.includes(day) ? schedule.days.filter((d) => d !== day) : [...schedule.days, day]
          return { ...schedule, days: newDays }
        }
        return schedule
      }),
    )
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col h-full">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b">
          <SheetHeader>
            <SheetTitle className="text-xl">{template ? "Edit Session" : "New Session"}</SheetTitle>
            <SheetDescription>
              {template ? "Make changes to the existing session." : "Add a new session to your calendar."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="session-form" onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* General Section */}
            <div className="rounded-lg overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left font-medium bg-gray-50"
                onClick={() => setGeneralExpanded(!generalExpanded)}
              >
                <span>General</span>
                {generalExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {generalExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="status" className="text-sm font-medium">
                      Session Status
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch id="status" checked={isOpen} onCheckedChange={setIsOpen} />
                      <Label htmlFor="status" className="text-sm font-medium">
                        {isOpen ? "Open" : "Closed"}
                      </Label>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Session Name <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-sm text-gray-500">0</span>
                    </div>
                    <Input id="name" placeholder="e.g., Regular Sauna" defaultValue={name} onChange={(e) => setName(e.target.value)} />
                    <p className="text-sm text-gray-500">Give your session a short and clear name.</p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Description
                      </Label>
                      <span className="text-sm text-gray-500">0</span>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Describe the session..."
                      defaultValue={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">Provide details about what participants can expect.</p>
                  </div>

                  {/* Capacity */}
                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-sm font-medium">
                      Capacity <span className="text-red-500">*</span>
                    </Label>
                    <Input id="capacity" type="number" min="1" defaultValue={capacity} onChange={(e) => setCapacity(e.target.value)} />
                    <p className="text-sm text-gray-500">Maximum number of participants allowed.</p>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium">
                      Duration <span className="text-red-500">*</span>
                    </Label>
                    <Input id="duration" type="time" value={duration} onChange={(e) => setDuration(e.target.value)} />
                    <p className="text-sm text-gray-500">Length of the session (hours:minutes).</p>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <div className="rounded-lg overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left font-medium bg-gray-50"
                onClick={() => setScheduleExpanded(!scheduleExpanded)}
              >
                <span>Schedule</span>
                {scheduleExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {scheduleExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Schedule Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Schedule Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Card
                        className={cn(
                          "cursor-pointer border",
                          scheduleType === "repeat" ? "border-primary bg-primary/5" : "border-gray-200",
                        )}
                        onClick={() => setScheduleType("repeat")}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                          {scheduleType === "repeat" && (
                            <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3 w-3"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </div>
                          )}
                          <span className="font-medium">Repeat</span>
                          <span className="text-sm text-gray-500 mt-1">Regular schedule</span>
                        </CardContent>
                      </Card>

                      <Card
                        className={cn(
                          "cursor-pointer border",
                          scheduleType === "once" ? "border-primary bg-primary/5" : "border-gray-200",
                        )}
                        onClick={() => setScheduleType("once")}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                          {scheduleType === "once" && (
                            <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3 w-3"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </div>
                          )}
                          <span className="font-medium">Once</span>
                          <span className="text-sm text-gray-500 mt-1">Single occurrence</span>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {scheduleType === "once" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-medium">
                          Date <span className="text-red-500">*</span>
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time" className="text-sm font-medium">
                          Time <span className="text-red-500">*</span>
                        </Label>
                        <Input id="time" type="time" defaultValue={schedules[0]?.time || "14:45"} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">Recurring Schedule</Label>
                        {schedules.map((schedule) => (
                          <div key={schedule.id} className="border rounded-md p-4 space-y-3 relative">
                            {schedules.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => removeSchedule(schedule.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor={`time-${schedule.id}`} className="text-sm font-medium">
                                Time <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id={`time-${schedule.id}`}
                                type="time"
                                value={schedule.time}
                                onChange={(e) => updateScheduleTime(schedule.id, e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Days <span className="text-red-500">*</span>
                              </Label>
                              <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map((day) => (
                                  <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(schedule.id, day.value)}
                                    className={cn(
                                      "px-3 py-1 rounded-md text-sm",
                                      schedule.days.includes(day.value)
                                        ? "bg-primary text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                                    )}
                                  >
                                    {day.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" className="w-full" onClick={addSchedule}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Another Time
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="border-t bg-white py-4 px-6 flex justify-between">
          <Button variant="outline" type="button" onClick={onClose}>
            Save as draft
          </Button>
          <Button type="submit" form="session-form" className="bg-primary" disabled={loading}>
            {template ? "Save Changes" : "Create Session"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
