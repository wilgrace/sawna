"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CalendarView } from "@/components/admin/calendar-view"
import { ListView } from "@/components/admin/list-view"
import { useCalendarView } from "@/hooks/use-calendar-view"
import { CalendarViewProvider } from "@/components/admin/calendar-view-provider"
import { SessionForm } from "@/components/admin/session-form"

interface SessionTemplate {
  id: string
  name: string
  description?: stringsupabase login
  capacity: number
  duration: string
  is_open: boolean
  created_at: string
  updated_at: string
  created_by: string
  schedules?: {
    id: string
    time: string
    days: string[]
  }[]
  instances?: {
    id: string
    date: string
    time: string
  }[]
}

export default function CalendarPage() {
  const [templates, setTemplates] = useState<SessionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("session_templates")
        .select(`
          *,
          session_schedules!template_id (*),
          session_instances!template_id (*)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", error.message)
        throw error
      }
      
      console.log("Fetched templates:", data)
      setTemplates(data || [])
    } catch (error) {
      console.error("Error details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewSession = () => {
    setSelectedTemplate(null)
    setShowSessionForm(true)
  }

  const handleEditSession = (template: SessionTemplate) => {
    setSelectedTemplate(template)
    setShowSessionForm(true)
  }

  const handleCloseForm = () => {
    setShowSessionForm(false)
    setSelectedTemplate(null)
  }

  return (
    <CalendarViewProvider>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <button
            onClick={handleNewSession}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            New Session
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : templates.length === 0 ? (
          <div>No sessions found</div>
        ) : (
          <>
            <CalendarView 
              templates={templates} 
              onEditSession={handleEditSession}
            />
            <ListView 
              templates={templates}
              onEditSession={handleEditSession}
            />
          </>
        )}

        <SessionForm
          open={showSessionForm}
          onClose={handleCloseForm}
          template={selectedTemplate}
          onSuccess={fetchTemplates}
        />
      </div>
    </CalendarViewProvider>
  )
}
