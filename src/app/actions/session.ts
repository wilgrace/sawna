"use server"

import { createClient } from "@supabase/supabase-js"
import { SessionTemplate } from "@/types/session"
import { auth } from "@clerk/nextjs/server"

interface CreateSessionTemplateParams {
  name: string
  description: string | null
  capacity: number
  duration_minutes: number
  is_open: boolean
  is_recurring: boolean
  one_off_start_time: string | null
  recurrence_start_date: string | null
  recurrence_end_date: string | null
  created_by: string
}

interface CreateSessionTemplateResult {
  success: boolean
  id?: string
  error?: string
}

interface CreateSessionInstanceParams {
  template_id: string
  start_time: string
  end_time: string
  status: string
}

interface CreateSessionInstanceResult {
  success: boolean
  id?: string
  error?: string
}

interface CreateSessionScheduleParams {
  session_template_id: string
  time: string
  days: string[]
  start_time_local: string
}

interface CreateSessionScheduleResult {
  success: boolean
  id?: string
  error?: string
}

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

// Helper function to create Supabase client
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function createSessionTemplate(params: CreateSessionTemplateParams): Promise<CreateSessionTemplateResult> {
  try {
    const userId = await getAuthenticatedUser()
    
    // Verify the created_by matches the authenticated user
    if (params.created_by !== userId) {
      return {
        success: false,
        error: "Unauthorized: created_by must match authenticated user"
      }
    }

    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from("session_templates")
      .insert({
        name: params.name,
        description: params.description,
        capacity: params.capacity,
        duration_minutes: params.duration_minutes,
        is_open: params.is_open,
        is_recurring: params.is_recurring,
        one_off_start_time: params.one_off_start_time,
        recurrence_start_date: params.recurrence_start_date,
        recurrence_end_date: params.recurrence_end_date,
        created_by: userId // Use the verified userId
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating session template:", error)
      return {
        success: false,
        error: error.message
      }
    }

    if (!data) {
      return {
        success: false,
        error: "No data returned from insert"
      }
    }

    return {
      success: true,
      id: data.id
    }
  } catch (error) {
    console.error("Error in createSessionTemplate:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

export async function createSessionInstance(params: CreateSessionInstanceParams): Promise<CreateSessionInstanceResult> {
  try {
    const userId = await getAuthenticatedUser()
    const supabase = createSupabaseClient()

    // Verify the user has permission to create instances for this template
    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select("created_by")
      .eq("id", params.template_id)
      .single()

    if (templateError || !template) {
      return {
        success: false,
        error: "Template not found"
      }
    }

    if (template.created_by !== userId) {
      return {
        success: false,
        error: "Unauthorized: You can only create instances for your own templates"
      }
    }

    const { data, error } = await supabase
      .from("session_instances")
      .insert({
        template_id: params.template_id,
        start_time: params.start_time,
        end_time: params.end_time,
        status: params.status
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating session instance:", error)
      return {
        success: false,
        error: error.message
      }
    }

    if (!data) {
      return {
        success: false,
        error: "No data returned from insert"
      }
    }

    return {
      success: true,
      id: data.id
    }
  } catch (error) {
    console.error("Error in createSessionInstance:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

export async function createSessionSchedule(params: CreateSessionScheduleParams): Promise<CreateSessionScheduleResult> {
  try {
    const userId = await getAuthenticatedUser()
    const supabase = createSupabaseClient()

    // Verify the user has permission to create schedules for this template
    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select("created_by")
      .eq("id", params.session_template_id)
      .single()

    if (templateError || !template) {
      return {
        success: false,
        error: "Template not found"
      }
    }

    if (template.created_by !== userId) {
      return {
        success: false,
        error: "Unauthorized: You can only create schedules for your own templates"
      }
    }

    // Convert day names to day_of_week integers
    const dayMap: { [key: string]: number } = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    }

    // Create a schedule for each day
    const schedulePromises = params.days.map(async (day) => {
      const dayOfWeek = dayMap[day.toLowerCase()]
      if (dayOfWeek === undefined) {
        throw new Error(`Invalid day: ${day}`)
      }

      // Ensure time is in HH:mm:ss format
      const time = params.time.length === 5 ? `${params.time}:00` : params.time

      const { data, error } = await supabase
        .from("session_schedules")
        .insert({
          session_template_id: params.session_template_id,
          template_id: params.session_template_id,
          start_time_of_day: time,
          day_of_week: dayOfWeek
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    })

    const results = await Promise.all(schedulePromises)

    if (results.some(result => !result)) {
      return {
        success: false,
        error: "Failed to create some schedules"
      }
    }

    return {
      success: true,
      id: results[0].id // Return the first schedule's ID
    }
  } catch (error) {
    console.error("Error in createSessionSchedule:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

export async function getSessionTemplates(): Promise<{ data: SessionTemplate[] | null; error: string | null }> {
  try {
    const userId = await getAuthenticatedUser()
    const supabase = createSupabaseClient()

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
      console.error("Error fetching templates:", error)
      return { data: null, error: error.message }
    }

    // Transform the data to match SessionTemplate type
    const transformedData = data?.map(template => ({
      ...template,
      schedules: template.schedules?.map(schedule => ({
        id: schedule.id,
        time: schedule.time,
        days: schedule.days,
        session_id: template.id,
        is_recurring: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) || [],
      instances: template.instances || []
    })) || []

    return { data: transformedData, error: null }
  } catch (error) {
    console.error("Error in getSessionTemplates:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
}

export async function getSessions(): Promise<{ data: SessionTemplate[] | null; error: string | null }> {
  try {
    const userId = await getAuthenticatedUser()
    const supabase = createSupabaseClient()

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
          start_time_of_day,
          day_of_week
        ),
        instances:session_instances!template_id (
          id,
          start_time,
          end_time,
          status
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching sessions:", error)
      return { data: null, error: error.message }
    }

    // Transform the data to match SessionTemplate type
    const transformedData = data?.map(template => ({
      ...template,
      schedules: template.schedules?.map(schedule => {
        // Convert day_of_week (0-6) to day name
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const dayName = dayNames[schedule.day_of_week]

        // Format time from HH:mm:ss to HH:mm
        const time = schedule.start_time_of_day.substring(0, 5)

        return {
          id: schedule.id,
          time,
          days: [dayName],
          session_id: template.id,
          is_recurring: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }) || [],
      instances: template.instances?.map(instance => ({
        id: instance.id,
        start_time: instance.start_time,
        end_time: instance.end_time,
        status: instance.status,
        template_id: template.id
      })) || []
    })) || []

    return { data: transformedData, error: null }
  } catch (error) {
    console.error("Error in getSessions:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
} 