"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CalendarView } from "@/components/admin/calendar-view"
import { ListView } from "@/components/admin/list-view"
import { useCalendarView } from "@/hooks/use-calendar-view"
import { CalendarViewProvider } from "@/components/admin/calendar-view-provider"
import { SessionForm } from "@/components/admin/session-form"
import { useUser, useAuth } from "@clerk/nextjs"
import { getClerkUser } from "@/app/actions/clerk"

interface SessionTemplate {
  id: string
  name: string
  description?: string
  capacity: number
  duration_minutes: number
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
    start_time: string
    end_time: string
  }[]
}

interface SessionInstance {
  id: string
  start_time: string
  end_time: string
}

export default function CalendarPage() {
  const [templates, setTemplates] = useState<SessionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null)
  const supabase = createClientComponentClient()
  const { user } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [user])

  const fetchTemplates = async () => {
    try {
      console.log("Fetching templates...")
      
      if (!user) {
        console.error("No user found")
        return
      }

      // Get the Clerk session token
      const token = await getToken()
      if (!token) {
        console.error("Failed to get authentication token")
        return
      }

      // Initialize Supabase client with the token
      const supabase = createClientComponentClient({
        options: {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      })

      // Get the clerk user ID using server action
      const clerkUserResult = await getClerkUser(user.id)
      console.log("Clerk user lookup result:", clerkUserResult)

      if (!clerkUserResult.success) {
        console.error("Error getting clerk user:", clerkUserResult.error)
        return
      }

      // Verify Supabase connection
      const { data: authData, error: authError } = await supabase.auth.getSession()
      console.log("Auth session:", authData)
      if (authError) {
        console.error("Auth error:", authError)
      }

      // Now try the full query
      const { data, error } = await supabase
        .from("session_templates")
        .select(`
          id,
          name,
          description,
          capacity,
          duration_minutes,
          is_open,
          created_at,
          updated_at,
          created_by,
          schedules:session_schedules!session_template_id (
            id,
            time,
            days
          ),
          instances:session_instances!template_id (
            id,
            start_time,
            end_time
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      console.log("Raw data from Supabase:", data)
      
      // Transform the data to match our expected format
      const transformedData = data?.map(template => ({
        ...template,
        schedules: template.schedules || [],
        instances: template.instances || []
      })) || []
      
      console.log("Transformed data:", transformedData)
      setTemplates(transformedData)
    } catch (error: any) {
      console.error("Error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack
      })
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
        <div className="text-center py-8">
          <p className="text-gray-500">No sessions found. Click "New Session" to create one.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <CalendarView 
            templates={templates} 
            onEditSession={handleEditSession}
          />
          <ListView 
            templates={templates}
            onEditSession={handleEditSession}
          />
        </div>
      )}

      <SessionForm
        open={showSessionForm}
        onClose={handleCloseForm}
        template={selectedTemplate}
        onSuccess={fetchTemplates}
      />
    </div>
  )
}
