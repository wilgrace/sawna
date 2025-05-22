"use server"

import { createClient } from "@supabase/supabase-js"
import { SessionTemplate, SessionSchedule } from "@/types/session"
import { auth, currentUser } from "@clerk/nextjs/server"
import { mapDayStringToInt, mapIntToDayString } from "@/lib/day-utils"
import { ensureClerkUser } from "./clerk"

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

interface UpdateSessionTemplateParams {
  id: string
  name?: string
  description?: string | null
  capacity?: number
  duration_minutes?: number
  is_open?: boolean
  is_recurring?: boolean
  one_off_start_time?: string | null
  recurrence_start_date?: string | null
  recurrence_end_date?: string | null
}

interface UpdateSessionTemplateResult {
  success: boolean
  error?: string
}

interface DeleteSessionSchedulesResult {
  success: boolean
  error?: string
}

interface DeleteSessionInstancesResult {
  success: boolean
  error?: string
}

interface DeleteScheduleResult {
  success: boolean
  error?: string
}

interface CreateBookingParams {
  session_template_id: string
  user_id: string
  start_time: string
  notes?: string
  number_of_spots?: number
}

interface CreateBookingResult {
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
  console.log("Creating Supabase client with environment variables:", {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    throw new Error("Missing required Supabase environment variables");
  }

  console.log("Initializing Supabase client with URL:", supabaseUrl);
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
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

    // Get the user's clerk_users record
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id, organization_id")
      .eq("clerk_user_id", userId)
      .single()

    if (userError) {
      console.error("Error getting clerk user:", userError)
      return {
        success: false,
        error: "Failed to get clerk user"
      }
    }

    if (!userData) {
      console.error("No clerk user found for ID:", userId)
      return {
        success: false,
        error: "No clerk user found"
      }
    }

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
        created_by: userData.id, // Use the clerk_users.id instead of clerk_user_id
        organization_id: userData.organization_id
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
      .select("created_by, organization_id")
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
        status: params.status,
        organization_id: template.organization_id // Add the organization_id from the template
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

    // Get the user's clerk_users record
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (userError) {
      console.error("Error getting clerk user:", userError)
      return { success: false, error: "Failed to get clerk user" }
    }

    if (!userData) {
      console.error("No clerk user found for ID:", userId)
      return { success: false, error: "No clerk user found" }
    }

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

    if (template.created_by !== userData.id) {
      return {
        success: false,
        error: "Unauthorized: You can only create schedules for your own templates"
      }
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(params.time)) {
      return {
        success: false,
        error: "Invalid time format. Expected HH:mm"
      }
    }

    // Create a schedule for each day
    const schedulePromises = params.days.map(async (day) => {
      const dayOfWeek = mapDayStringToInt(day)

      const { data, error } = await supabase
        .from("session_schedules")
        .insert({
          session_template_id: params.session_template_id,
          start_time_local: params.time,
          day_of_week: dayOfWeek,
          time: params.time,
          days: [day.toLowerCase()], // Store the day name for reference
          is_active: true
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

    return { success: true }
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
        is_recurring,
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
      is_recurring: template.is_recurring ?? false,
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
  console.log("=== getSessions CALLED ===");
  try {
    const { userId } = await auth()
    console.log("Authenticated user ID:", userId)

    if (!userId) {
      console.error("No user ID from Clerk")
      return { 
        data: null, 
        error: "No user ID from Clerk" 
      }
    }

    // Get the full user object
    const user = await currentUser()
    console.log("Clerk user object:", user)

    if (!user) {
      console.error("No user object from Clerk")
      return {
        data: null,
        error: "No user object from Clerk"
      }
    }

    let supabase
    try {
      supabase = createSupabaseClient()
      console.log("Supabase client created successfully")
    } catch (error) {
      console.error("Failed to create Supabase client:", error)
      return { 
        data: null, 
        error: "Failed to initialize database connection" 
      }
    }

    // Get email from the user's primary email address
    const primaryEmail = user.emailAddresses[0]?.emailAddress
    if (!primaryEmail) {
      console.error("No primary email found for user:", user)
      return {
        data: null,
        error: "No primary email found for user"
      }
    }

    console.log("User data from Clerk:", {
      email: primaryEmail,
      firstName: user.firstName,
      lastName: user.lastName
    })

    // Ensure the clerk user exists in the database
    const { success, id: clerkUserId, error: clerkError } = await ensureClerkUser(
      userId,
      primaryEmail,
      user.firstName,
      user.lastName
    )

    if (!success || !clerkUserId) {
      console.error("Error ensuring clerk user:", clerkError)
      return { 
        data: null, 
        error: `Failed to ensure clerk user: ${clerkError}` 
      }
    }

    // Try a very simple query first
    try {
      const { data: simpleData, error: simpleError } = await supabase
        .from('session_templates')
        .select('id, name')
        .eq('created_by', clerkUserId)
        .limit(1)
      
      console.log("Simple query result:", { 
        data: simpleData, 
        error: simpleError,
        hasData: !!simpleData,
        dataLength: simpleData?.length
      })
      
      if (simpleError) {
        console.error("Simple query error:", {
          message: simpleError.message,
          details: simpleError.details,
          hint: simpleError.hint,
          code: simpleError.code,
          error: simpleError
        })
        return { data: null, error: `Simple query failed: ${simpleError.message}` }
      }
    } catch (simpleError) {
      console.error("Simple query caught error:", simpleError)
      return { data: null, error: `Simple query error: ${simpleError instanceof Error ? simpleError.message : 'Unknown error'}` }
    }

    // If simple query succeeds, try the full query
    try {
      console.log("Attempting full query...")
      
      // First, get the templates
      const { data: templates, error: templatesError } = await supabase
        .from("session_templates")
        .select(`
          id,
          name,
          description,
          capacity,
          duration_minutes,
          is_open,
          is_recurring,
          one_off_start_time,
          recurrence_start_date,
          recurrence_end_date,
          created_at,
          updated_at,
          created_by,
          organization_id
        `)
        .eq('created_by', clerkUserId)
        .order("created_at", { ascending: false })

      if (templatesError) {
        console.error("Templates query error:", templatesError)
        return { data: null, error: `Templates query failed: ${templatesError.message}` }
      }

      console.log("Templates query successful:", { 
        count: templates?.length,
        firstTemplate: templates?.[0]
      })

      if (!templates || templates.length === 0) {
        return { data: [], error: null }
      }

      // Then, get the schedules for each template
      const templateIds = templates.map(t => t.id)
      console.log("Querying schedules for template IDs:", templateIds)
      
      const { data: schedules, error: schedulesError } = await supabase
        .from("session_schedules")
        .select(`
          id,
          session_template_id,
          start_time_local,
          day_of_week,
          is_active,
          created_at,
          updated_at
        `)
        .in('session_template_id', templateIds)

      if (schedulesError) {
        console.error("Schedules query error details:", {
          message: schedulesError.message,
          details: schedulesError.details,
          hint: schedulesError.hint,
          code: schedulesError.code,
          error: schedulesError
        })
        return { data: null, error: `Schedules query failed: ${schedulesError.message}` }
      }

      console.log("Raw schedules data:", schedules)

      // If no schedules exist, that's okay - just use an empty array
      const schedulesList = schedules || []

      // Finally, get the instances
      const { data: instances, error: instancesError } = await supabase
        .from("session_instances")
        .select(`
          id,
          template_id,
          start_time,
          end_time,
          status
        `)
        .in('template_id', templateIds)

      if (instancesError) {
        console.error("Instances query error:", instancesError)
        return { data: null, error: `Instances query failed: ${instancesError.message}` }
      }

      console.log("Instances query successful:", {
        count: instances?.length,
        firstInstance: instances?.[0]
      })

      // Combine the data
      const transformedData = templates.map(template => {
        const templateSchedules = schedulesList.filter(s => s.session_template_id === template.id)
        const templateInstances = instances?.filter(i => i.template_id === template.id) || []

        // Group schedules by time
        const scheduleGroups: Record<string, SessionSchedule> = templateSchedules.reduce((groups, schedule) => {
          const time = schedule.start_time_local?.substring(0, 5)
          if (!groups[time]) {
            groups[time] = {
              id: schedule.id,
              time,
              days: [],
              session_id: template.id,
              is_recurring: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
          const dayName = mapIntToDayString(schedule.day_of_week, true) // Use full day names
          groups[time].days.push(dayName)
          return groups
        }, {} as Record<string, SessionSchedule>)

        return {
          ...template,
          is_recurring: template.is_recurring ?? false,
          schedules: Object.values(scheduleGroups),
          instances: templateInstances.map(instance => ({
            id: instance.id,
            start_time: instance.start_time,
            end_time: instance.end_time,
            status: instance.status,
            template_id: template.id
          }))
        } as SessionTemplate
      })

      console.log("Transformed data:", {
        count: transformedData.length,
        firstTemplate: transformedData[0]
      })

      return { data: transformedData, error: null }
    } catch (queryError) {
      console.error("Full query caught error:", queryError)
      return { 
        data: null, 
        error: `Query error: ${queryError instanceof Error ? queryError.message : 'Unknown error'}` 
      }
    }
  } catch (error) {
    console.error("Error in getSessions:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
}

export async function getSession(id: string): Promise<{ data: SessionTemplate | null; error: string | null }> {
  console.log("=== getSession CALLED ===");
  console.log("Session ID:", id);
  
  try {
    // Check authentication state
    const { userId } = await auth();
    console.log("Authenticated user ID:", userId);

    if (!userId) {
      console.error("No user ID from Clerk");
      return { 
        data: null, 
        error: "No user ID from Clerk" 
      };
    }

    console.log("Creating Supabase client...");
    const supabase = createSupabaseClient();
    console.log("Supabase client created successfully");

    // Get the user's clerk_users record
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    console.log("Clerk user lookup result:", { 
      userData,
      userError,
      query: {
        clerk_user_id: userId
      }
    });

    if (userError) {
      console.error("Error getting clerk user:", userError);
      return { data: null, error: "Failed to get clerk user" };
    }

    if (!userData) {
      console.error("No clerk user found for ID:", userId);
      return { data: null, error: "No clerk user found" };
    }

    console.log("Querying session template...");
    // First get the template
    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select(`
        id,
        name,
        description,
        capacity,
        duration_minutes,
        is_open,
        is_recurring,
        created_at,
        updated_at,
        created_by,
        organization_id
      `)
      .eq("id", id)
      .single();

    if (templateError) {
      console.error("Error fetching template:", templateError);
      return { data: null, error: templateError.message };
    }

    if (!template) {
      console.log("No template found with ID:", id);
      return { data: null, error: "Template not found" };
    }

    // Then get the schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("session_schedules")
      .select(`
        id,
        session_template_id,
        start_time_local,
        day_of_week,
        is_active,
        created_at,
        updated_at
      `)
      .eq("session_template_id", id);

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      return { data: null, error: schedulesError.message };
    }

    // Finally get the instances
    const { data: instances, error: instancesError } = await supabase
      .from("session_instances")
      .select(`
        id,
        template_id,
        start_time,
        end_time,
        status
      `)
      .eq("template_id", id);

    if (instancesError) {
      console.error("Error fetching instances:", instancesError);
      return { data: null, error: instancesError.message };
    }

    // Group schedules by time
    const scheduleGroups: Record<string, SessionSchedule> = (schedules || []).reduce((groups, schedule) => {
      const time = schedule.start_time_local?.substring(0, 5);
      if (!groups[time]) {
        groups[time] = {
          id: schedule.id,
          time,
          days: [],
          session_id: template.id,
          is_recurring: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      const dayName = mapIntToDayString(schedule.day_of_week, true);
      groups[time].days.push(dayName);
      return groups;
    }, {} as Record<string, SessionSchedule>);

    // Transform the data to match SessionTemplate type
    const transformedData = {
      ...template,
      is_recurring: template.is_recurring ?? false,
      schedules: Object.values(scheduleGroups),
      instances: instances?.map(instance => ({
        id: instance.id,
        start_time: instance.start_time,
        end_time: instance.end_time,
        status: instance.status,
        template_id: template.id
      })) || []
    };

    console.log("Transformed data:", transformedData);
    return { data: transformedData, error: null };
  } catch (error) {
    console.error("Error in getSession:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

export async function updateSessionTemplate(params: UpdateSessionTemplateParams): Promise<UpdateSessionTemplateResult> {
  try {
    const userId = await getAuthenticatedUser()
    const supabase = createSupabaseClient()

    // Get the user's clerk_users record
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (userError) {
      console.error("Error getting clerk user:", userError)
      return { success: false, error: "Failed to get clerk user" }
    }

    if (!userData) {
      console.error("No clerk user found for ID:", userId)
      return { success: false, error: "No clerk user found" }
    }

    // Only allow update if the user is the creator
    const { data: template, error: fetchError } = await supabase
      .from("session_templates")
      .select("created_by")
      .eq("id", params.id)
      .single()

    if (fetchError || !template) {
      return { success: false, error: "Template not found" }
    }
    if (template.created_by !== userData.id) {
      return { success: false, error: "Unauthorized: You can only update your own templates" }
    }

    // Remove id from update fields
    const id = params.id;
    const updateFields = { ...params };
    delete (updateFields as any).id;
    (updateFields as any)["updated_at"] = new Date().toISOString();

    const { error } = await supabase
      .from("session_templates")
      .update(updateFields)
      .eq("id", id)

    if (error) {
      console.error("Error updating session template:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error("Error in updateSessionTemplate:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}

export async function deleteSessionSchedules(templateId: string): Promise<DeleteSessionSchedulesResult> {
  try {
    const userId = await getAuthenticatedUser()
    const supabase = createSupabaseClient()

    // Get the user's clerk_users record
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (userError) {
      console.error("Error getting clerk user:", userError)
      return { success: false, error: "Failed to get clerk user" }
    }

    if (!userData) {
      console.error("No clerk user found for ID:", userId)
      return { success: false, error: "No clerk user found" }
    }

    // Verify the user owns the template
    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select("created_by")
      .eq("id", templateId)
      .single()

    if (templateError || !template) {
      return { success: false, error: "Template not found" }
    }

    if (template.created_by !== userData.id) {
      return { success: false, error: "Unauthorized: You can only delete schedules for your own templates" }
    }

    const { error } = await supabase
      .from("session_schedules")
      .delete()
      .eq("session_template_id", templateId)

    if (error) {
      console.error("Error deleting schedules:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteSessionSchedules:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}

export async function deleteSessionInstances(templateId: string): Promise<DeleteSessionInstancesResult> {
  try {
    const userId = await getAuthenticatedUser()
    const supabase = createSupabaseClient()

    // Get the user's clerk_users record
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (userError) {
      console.error("Error getting clerk user:", userError)
      return { success: false, error: "Failed to get clerk user" }
    }

    if (!userData) {
      console.error("No clerk user found for ID:", userId)
      return { success: false, error: "No clerk user found" }
    }

    // Verify the user owns the template
    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select("created_by")
      .eq("id", templateId)
      .single()

    if (templateError || !template) {
      return { success: false, error: "Template not found" }
    }

    if (template.created_by !== userData.id) {
      return { success: false, error: "Unauthorized: You can only delete instances for your own templates" }
    }

    const { error } = await supabase
      .from("session_instances")
      .delete()
      .eq("template_id", templateId)

    if (error) {
      console.error("Error deleting instances:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteSessionInstances:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}

export async function deleteSessionTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUser()
    const supabase = createSupabaseClient()

    // Get the user's clerk_users record
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (userError) {
      console.error("Error getting clerk user:", userError)
      return { success: false, error: "Failed to get clerk user" }
    }

    if (!userData) {
      console.error("No clerk user found for ID:", userId)
      return { success: false, error: "No clerk user found" }
    }

    // Verify the user owns the template
    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select("created_by")
      .eq("id", templateId)
      .single()

    if (templateError || !template) {
      return { success: false, error: "Template not found" }
    }

    if (template.created_by !== userData.id) {
      return { success: false, error: "Unauthorized: You can only delete your own templates" }
    }

    const { error } = await supabase
      .from("session_templates")
      .delete()
      .eq("id", templateId)

    if (error) {
      console.error("Error deleting template:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteSessionTemplate:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}

export async function deleteSchedule(scheduleId: string): Promise<DeleteScheduleResult> {
  try {
    const userId = await getAuthenticatedUser()
    const supabase = createSupabaseClient()

    // Get the user's clerk_users record
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (userError) {
      console.error("Error getting clerk user:", userError)
      return { success: false, error: "Failed to get clerk user" }
    }

    if (!userData) {
      console.error("No clerk user found for ID:", userId)
      return { success: false, error: "No clerk user found" }
    }

    // First get the schedule to find its template
    const { data: schedule, error: scheduleError } = await supabase
      .from("session_schedules")
      .select("session_template_id")
      .eq("id", scheduleId)
      .single()

    if (scheduleError || !schedule) {
      return { success: false, error: "Schedule not found" }
    }

    // Verify the user owns the template
    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select("created_by")
      .eq("id", schedule.session_template_id)
      .single()

    if (templateError || !template) {
      return { success: false, error: "Template not found" }
    }

    if (template.created_by !== userData.id) {
      return { success: false, error: "Unauthorized: You can only delete schedules for your own templates" }
    }

    // Delete the specific schedule
    const { error } = await supabase
      .from("session_schedules")
      .delete()
      .eq("id", scheduleId)

    if (error) {
      console.error("Error deleting schedule:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteSchedule:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}

export async function createBooking(params: CreateBookingParams): Promise<CreateBookingResult> {
  try {
    const supabase = createSupabaseClient()

    // First, verify that the user exists in clerk_users
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id, organization_id")
      .eq("id", params.user_id)
      .single()

    if (userError || !userData) {
      console.error("Error verifying user:", userError)
      return {
        success: false,
        error: "User not found"
      }
    }

    // Get the session template to calculate end time
    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select("duration_minutes, is_open, organization_id")
      .eq("id", params.session_template_id)
      .single()

    if (templateError) {
      console.error("Error fetching session template:", templateError)
      return {
        success: false,
        error: "Failed to verify session availability"
      }
    }

    if (!template) {
      return {
        success: false,
        error: "Session not found"
      }
    }

    if (!template.is_open) {
      return {
        success: false,
        error: "This session is not available for booking"
      }
    }

    // Verify the user belongs to the same organization as the template
    if (userData.organization_id !== template.organization_id) {
      return {
        success: false,
        error: "You can only book sessions from your organization"
      }
    }

    // Calculate end time based on start time and duration
    const startTime = new Date(params.start_time)
    const endTime = new Date(startTime.getTime() + template.duration_minutes * 60000)

    // Create a session instance
    const { data: instance, error: instanceError } = await supabase
      .from("session_instances")
      .insert({
        template_id: params.session_template_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "scheduled",
        organization_id: template.organization_id
      })
      .select()
      .single()

    if (instanceError) {
      console.error("Error creating session instance:", instanceError)
      return {
        success: false,
        error: "Failed to create session instance"
      }
    }

    // Create the booking
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        session_instance_id: instance.id,
        user_id: params.user_id,
        number_of_spots: params.number_of_spots || 1,
        status: "confirmed",
        notes: params.notes,
        organization_id: template.organization_id
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating booking:", error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      id: data.id
    }
  } catch (error) {
    console.error("Error in createBooking:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

export async function getPublicSessions(): Promise<{ data: SessionTemplate[] | null; error: string | null }> {
  console.log("=== getPublicSessions CALLED ===");
  try {
    const supabase = createSupabaseClient()
    console.log("Supabase client created successfully")

    // Get all open templates
    const { data: templates, error: templatesError } = await supabase
      .from("session_templates")
      .select(`
        id,
        name,
        description,
        capacity,
        duration_minutes,
        is_open,
        is_recurring,
        one_off_start_time,
        recurrence_start_date,
        recurrence_end_date,
        created_at,
        updated_at,
        created_by,
        organization_id
      `)
      .eq('is_open', true)
      .order("created_at", { ascending: false })

    if (templatesError) {
      console.error("Templates query error:", templatesError)
      return { data: null, error: `Templates query failed: ${templatesError.message}` }
    }

    console.log("Templates query successful:", { 
      count: templates?.length,
      firstTemplate: templates?.[0]
    })

    if (!templates || templates.length === 0) {
      return { data: [], error: null }
    }

    // Get schedules for all templates
    const templateIds = templates.map(t => t.id)
    console.log("Querying schedules for template IDs:", templateIds)
    
    const { data: schedules, error: schedulesError } = await supabase
      .from("session_schedules")
      .select(`
        id,
        session_template_id,
        start_time_local,
        day_of_week,
        is_active,
        created_at,
        updated_at
      `)
      .in('session_template_id', templateIds)

    if (schedulesError) {
      console.error("Schedules query error:", schedulesError)
      return { data: null, error: `Schedules query failed: ${schedulesError.message}` }
    }

    console.log("Raw schedules data:", schedules)

    // Get instances for all templates
    const { data: instances, error: instancesError } = await supabase
      .from("session_instances")
      .select(`
        id,
        template_id,
        start_time,
        end_time,
        status
      `)
      .in('template_id', templateIds)
      .gte('start_time', new Date().toISOString()) // Only get future instances
      .order('start_time', { ascending: true })

    if (instancesError) {
      console.error("Instances query error:", instancesError)
      return { data: null, error: `Instances query failed: ${instancesError.message}` }
    }

    console.log("Instances query successful:", {
      count: instances?.length,
      firstInstance: instances?.[0]
    })

    // Combine the data
    const transformedData = templates.map(template => {
      const templateSchedules = schedules?.filter(s => s.session_template_id === template.id) || []
      const templateInstances = instances?.filter(i => i.template_id === template.id) || []

      // Group schedules by time
      const scheduleGroups: Record<string, SessionSchedule> = templateSchedules.reduce((groups, schedule) => {
        const time = schedule.start_time_local?.substring(0, 5)
        if (!groups[time]) {
          groups[time] = {
            id: schedule.id,
            time,
            days: [],
            session_id: template.id,
            is_recurring: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
        const dayName = mapIntToDayString(schedule.day_of_week, true)
        groups[time].days.push(dayName)
        return groups
      }, {} as Record<string, SessionSchedule>)

      return {
        ...template,
        is_recurring: template.is_recurring ?? false,
        schedules: Object.values(scheduleGroups),
        instances: templateInstances.map(instance => ({
          id: instance.id,
          start_time: instance.start_time,
          end_time: instance.end_time,
          status: instance.status,
          template_id: template.id
        }))
      } as SessionTemplate
    })

    console.log("Transformed data:", {
      count: transformedData.length,
      firstTemplate: transformedData[0]
    })

    return { data: transformedData, error: null }
  } catch (error) {
    console.error("Error in getPublicSessions:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
} 