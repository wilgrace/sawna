"use server"

import { createClient } from "@supabase/supabase-js"
import { SessionTemplate, SessionSchedule } from "@/types/session"
import { auth, currentUser } from "@clerk/nextjs/server"
import { mapDayStringToInt, mapIntToDayString } from "@/lib/day-utils"
import { ensureClerkUser } from "./clerk"
import { Booking } from "@/types/booking"

// These should come from your environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CreateSessionTemplateParams {
  name: string
  description: string | null
  capacity: number
  duration_minutes: number
  is_open: boolean
  is_recurring: boolean
  one_off_start_time: string | null
  one_off_date: string | null
  recurrence_start_date: string | null
  recurrence_end_date: string | null
  created_by: string
  schedules?: SessionSchedule[]
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
  one_off_date?: string | null
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

interface BookingResponse {
  id: string
  number_of_spots: number
  notes: string | null
  session_instances: {
    id: string
    start_time: string
    end_time: string
    session_templates: {
      id: string
      name: string
      duration_minutes: number
    }
  }
}

interface DBSessionInstance {
  id: string;
  template_id: string;
  start_time: string;
  end_time: string;
  status: string;
  bookings: {
    id: string;
    number_of_spots: number;
    user: {
      id: string;
      clerk_user_id: string;
    };
  }[];
}

interface DBSessionTemplate {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  duration_minutes: number;
  is_open: boolean;
  is_recurring: boolean;
  one_off_start_time: string | null;
  one_off_date: string | null;
  recurrence_start_date: string | null;
  recurrence_end_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  organization_id: string;
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

    // Create the template first
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
        one_off_date: params.one_off_date,
        recurrence_start_date: params.recurrence_start_date,
        recurrence_end_date: params.recurrence_end_date,
        created_by: userData.id,
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

    // Create schedules if provided
    if (params.schedules && params.schedules.length > 0) {
      const { error: scheduleError } = await supabase
        .from("session_schedules")
        .insert(params.schedules.map(schedule => ({
          ...schedule,
          session_template_id: data.id
        })));

      if (scheduleError) {
        console.error("Error creating schedules:", scheduleError);
        return {
          success: false,
          error: `Failed to create schedules: ${scheduleError.message}`
        };
      }

      // Verify schedules were created
      const { data: createdSchedules, error: verifyError } = await supabase
        .from("session_schedules")
        .select("*")
        .eq("session_template_id", data.id);

      if (verifyError || !createdSchedules || createdSchedules.length === 0) {
        console.error("Failed to verify schedule creation:", verifyError);
        return {
          success: false,
          error: "Failed to verify schedule creation"
        };
      }
    }

    // Trigger instance generation for recurring templates
    if (params.is_recurring) {
      try {
        const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
        const functionUrl = IS_DEVELOPMENT 
          ? 'http://localhost:54321/functions/v1/generate-instances'
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-instances`;

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ template_id_to_process: data.id }),
        });

        if (!response.ok) {
          console.error("Error calling edge function:", await response.text());
        }
      } catch (error) {
        console.error("Error triggering instance generation:", error);
        // Don't fail the template creation if instance generation fails
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

    // Get the user's clerk_users record
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id, clerk_user_id")
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

    // Verify the user has permission to create instances for this template
    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select(`
        created_by,
        organization_id
      `)
      .eq("id", params.template_id)
      .single()

    if (templateError || !template) {
      return {
        success: false,
        error: "Template not found"
      }
    }

    // Compare the created_by ID with the user's clerk_users.id
    if (template.created_by !== userData.id) {
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
        organization_id: template.organization_id
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

      console.log(`Creating schedule for day ${day} (day_of_week: ${dayOfWeek})`);

      const { data, error } = await supabase
        .from("session_schedules")
        .insert({
          session_template_id: params.session_template_id,
          day_of_week: dayOfWeek,
          time: params.time,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error(`Error creating schedule for day ${day}:`, error);
        throw error
      }

      console.log(`Successfully created schedule:`, data);
      return data
    })

    const results = await Promise.all(schedulePromises)

    if (results.some(result => !result)) {
      return {
        success: false,
        error: "Failed to create some schedules"
      }
    }

    // Log the created schedules
    console.log("Created schedules:", results);

    return { success: true }
  } catch (error) {
    console.error("Error in createSessionSchedule:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
}

export async function getSessions(): Promise<{ data: SessionTemplate[] | null; error: string | null }> {
  console.log("=== getSessions CALLED ===");
  try {
    const { userId } = await auth()
    if (!userId) {
      return { data: null, error: "No user ID from Clerk" }
    }

    const supabase = createSupabaseClient()

    // Get the user's clerk_users record
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (userError || !userData) {
      return { data: null, error: "Failed to get clerk user" }
    }

    // Get templates
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
        one_off_date,
        recurrence_start_date,
        recurrence_end_date,
        created_at,
        updated_at,
        created_by,
        organization_id
      `)
      .eq('created_by', userData.id)
      .order("created_at", { ascending: false })

    if (templatesError) {
      return { data: null, error: templatesError.message }
    }

    if (!templates || templates.length === 0) {
      return { data: [], error: null }
    }

    // Get schedules
    const templateIds = templates.map(t => t.id)
    const { data: schedules, error: schedulesError } = await supabase
      .from("session_schedules")
      .select(`
        id,
        session_template_id,
        day_of_week,
        is_active,
        created_at,
        updated_at,
        time
      `)
      .in('session_template_id', templateIds)

    if (schedulesError) {
      return { data: null, error: schedulesError.message }
    }

    // Get instances with bookings
    const { data: instances, error: instancesError } = await supabase
      .from("session_instances")
      .select(`
        id,
        template_id,
        start_time,
        end_time,
        status,
        bookings (
          id,
          number_of_spots,
          user:clerk_users!user_id (
            id,
            clerk_user_id
          )
        )
      `)
      .in('template_id', templateIds)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })

    if (instancesError) {
      return { data: null, error: instancesError.message }
    }

    // Transform the data
    const transformedData = (templates as DBSessionTemplate[]).map(template => {
      const templateSchedules = schedules?.filter(s => s.session_template_id === template.id) || []
      const templateInstances = (instances as unknown as DBSessionInstance[])?.filter(i => i.template_id === template.id) || []

      // Group schedules by time
      const scheduleGroups: Record<string, SessionSchedule> = templateSchedules.reduce((groups, schedule) => {
        const time = schedule.time?.substring(0, 5)
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

      // Transform instances to include bookings
      const transformedInstances = templateInstances.map(instance => {
        const bookings = instance.bookings?.map(booking => {
          const user = booking.user;
          return {
            id: booking.id,
            number_of_spots: booking.number_of_spots || 1,
            user: {
              id: user?.id || '',
              clerk_user_id: user?.clerk_user_id || ''
            }
          };
        }) || [];

        return {
          id: instance.id,
          start_time: instance.start_time,
          end_time: instance.end_time,
          status: instance.status,
          template_id: template.id,
          bookings
        };
      });

      const transformedTemplate = {
        id: template.id,
        name: template.name,
        description: template.description,
        capacity: template.capacity,
        duration_minutes: template.duration_minutes,
        is_open: template.is_open,
        is_recurring: template.is_recurring ?? false,
        one_off_start_time: template.one_off_start_time,
        one_off_date: template.one_off_date,
        recurrence_start_date: template.recurrence_start_date,
        recurrence_end_date: template.recurrence_end_date,
        created_at: template.created_at,
        updated_at: template.updated_at,
        created_by: template.created_by,
        organization_id: template.organization_id,
        schedules: Object.values(scheduleGroups),
        instances: transformedInstances
      } as unknown as SessionTemplate

      return transformedTemplate
    })

    return { data: transformedData, error: null }
  } catch (error) {
    console.error("Error in getSessions:", error)
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
        one_off_start_time,
        one_off_date,
        recurrence_start_date,
        recurrence_end_date,
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
        day_of_week,
        is_active,
        created_at,
        updated_at,
        time
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
      const time = schedule.time;
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
        template_id: template.id,
        start_time: instance.start_time,
        end_time: instance.end_time,
        status: instance.status || 'scheduled',
        bookings: []
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
    console.log("=== createBooking CALLED ===");
    console.log("Booking params:", params);
    
    const supabase = createSupabaseClient()

    // First, verify that the user exists in clerk_users
    const { data: userData, error: userError } = await supabase
      .from("clerk_users")
      .select("id, organization_id, clerk_user_id")
      .eq("id", params.user_id)
      .single()

    if (userError) {
      console.error("Error verifying user:", {
        error: userError,
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code
      });
      return {
        success: false,
        error: "User not found"
      }
    }

    if (!userData) {
      console.error("No user data found for ID:", params.user_id);
      return {
        success: false,
        error: "User not found"
      }
    }

    console.log("User data found:", userData);

    // Get the session template to verify it exists and is open
    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select("duration_minutes, is_open, organization_id")
      .eq("id", params.session_template_id)
      .single()

    if (templateError) {
      console.error("Error fetching session template:", {
        error: templateError,
        message: templateError.message,
        details: templateError.details,
        hint: templateError.hint,
        code: templateError.code
      });
      return {
        success: false,
        error: "Failed to verify session availability"
      }
    }

    if (!template) {
      console.error("No template found for ID:", params.session_template_id);
      return {
        success: false,
        error: "Session not found"
      }
    }

    console.log("Template data found:", template);

    if (!template.is_open) {
      console.error("Template is not open for booking:", params.session_template_id);
      return {
        success: false,
        error: "This session is not available for booking"
      }
    }

    // Verify the user belongs to the same organization as the template
    if (userData.organization_id !== template.organization_id) {
      console.error("Organization mismatch:", {
        userOrgId: userData.organization_id,
        templateOrgId: template.organization_id
      });
      return {
        success: false,
        error: "You can only book sessions from your organization"
      }
    }

    // Find the existing instance for this time slot
    const startTime = new Date(params.start_time)
    const endTime = new Date(startTime.getTime() + template.duration_minutes * 60000)

    const { data: instance, error: instanceError } = await supabase
      .from("session_instances")
      .select("id")
      .eq("template_id", params.session_template_id)
      .eq("start_time", startTime.toISOString())
      .eq("end_time", endTime.toISOString())
      .eq("status", "scheduled")
      .single()

    if (instanceError) {
      console.error("Error finding session instance:", {
        error: instanceError,
        message: instanceError.message,
        details: instanceError.details,
        hint: instanceError.hint,
        code: instanceError.code
      });
      return {
        success: false,
        error: "Failed to find session instance"
      }
    }

    if (!instance) {
      console.error("No instance found for template at time:", params.start_time);
      return {
        success: false,
        error: "This session time slot is not available"
      }
    }

    console.log("Found existing instance:", instance);

    // Create a new Supabase client for the booking to ensure fresh auth state
    const bookingSupabase = createSupabaseClient();
    
    // Create the booking
    const bookingData = {
      session_instance_id: instance.id,
      user_id: userData.id,
      number_of_spots: params.number_of_spots || 1,
      status: "confirmed",
      notes: params.notes,
      organization_id: template.organization_id
    };

    console.log("Creating booking with data:", bookingData);

    const { data, error } = await bookingSupabase
      .from("bookings")
      .insert(bookingData)
      .select()
      .single()

    if (error) {
      console.error("Error creating booking:", {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        data: bookingData
      });
      return {
        success: false,
        error: error.message || "Failed to create booking"
      }
    }

    console.log("Booking created successfully:", data);

    return {
      success: true,
      id: data.id
    }
  } catch (error) {
    console.error("Error in createBooking:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
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
        one_off_date,
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
        day_of_week,
        is_active,
        created_at,
        updated_at,
        time
      `)
      .in('session_template_id', templateIds)

    if (schedulesError) {
      console.error("Schedules query error:", schedulesError)
      return { data: null, error: `Schedules query failed: ${schedulesError.message}` }
    }

    // Get instances for all templates with their bookings
    const { data: instances, error: instancesError } = await supabase
      .from("session_instances")
      .select(`
        id,
        template_id,
        start_time,
        end_time,
        status,
        bookings (
          id,
          number_of_spots,
          user:clerk_users!user_id (
            id,
            clerk_user_id
          )
        )
      `)
      .in('template_id', templateIds)
      .gte('start_time', new Date().toISOString()) // Only get future instances
      .order('start_time', { ascending: true })

    if (instancesError) {
      console.error("Instances query error:", instancesError)
      return { data: null, error: `Instances query failed: ${instancesError.message}` }
    }

    // Combine the data
    const transformedData = (templates as DBSessionTemplate[]).map(template => {
      const templateSchedules = schedules?.filter(s => s.session_template_id === template.id) || []
      const templateInstances = (instances as unknown as DBSessionInstance[])?.filter(i => i.template_id === template.id) || []

      // Group schedules by time
      const scheduleGroups: Record<string, SessionSchedule> = templateSchedules.reduce((groups, schedule) => {
        const time = schedule.time?.substring(0, 5)
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

      // Transform instances to include bookings
      const transformedInstances = templateInstances.map(instance => {
        const bookings = instance.bookings?.map(booking => {
          const user = booking.user;
          return {
            id: booking.id,
            number_of_spots: booking.number_of_spots || 1,
            user: {
              id: user?.id || '',
              clerk_user_id: user?.clerk_user_id || ''
            }
          };
        }) || [];

        return {
          id: instance.id,
          start_time: instance.start_time,
          end_time: instance.end_time,
          status: instance.status,
          template_id: template.id,
          bookings
        };
      });

      return {
        ...template,
        is_recurring: template.is_recurring ?? false,
        schedules: Object.values(scheduleGroups),
        instances: transformedInstances
      } as SessionTemplate
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

export async function updateBooking({
  booking_id,
  notes,
  number_of_spots,
}: {
  booking_id: string
  notes?: string
  number_of_spots: number
}) {
  try {
    console.log("\n=== updateBooking Debug ===");
    console.log("Input parameters:", { booking_id, notes, number_of_spots });

    const supabase = createSupabaseClient();

    // First verify the booking exists
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', booking_id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking booking:", checkError);
      return { success: false, error: `Failed to verify booking: ${checkError.message}` };
    }

    if (!existingBooking) {
      console.error("No booking found with ID:", booking_id);
      return { success: false, error: "Booking not found" };
    }

    // Now update the booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        notes,
        number_of_spots,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking_id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: `Failed to update booking: ${error.message}` };
    }

    if (!booking) {
      console.error("No booking returned after update");
      return { success: false, error: "Failed to update booking: No data returned" };
    }

    return { success: true, data: booking };
  } catch (error: any) {
    console.error('Error in updateBooking:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteBooking(booking_id: string) {
  try {
    console.log("\n=== deleteBooking Debug ===");
    console.log("Input parameters:", { booking_id });

    const supabase = createSupabaseClient();

    // First verify the booking exists
    console.log("\nStep 1: Verifying booking exists...");
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', booking_id)
      .maybeSingle();

    console.log("Booking check result:", { existingBooking, checkError });

    if (checkError) {
      console.error("Error checking booking:", checkError);
      return { success: false, error: `Failed to verify booking: ${checkError.message}` };
    }

    if (!existingBooking) {
      console.error("No booking found with ID:", booking_id);
      return { success: false, error: "Booking not found" };
    }

    // Now delete the booking
    console.log("\nStep 2: Deleting booking...");
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', booking_id);

    console.log("Delete result:", { error: deleteError });

    if (deleteError) {
      console.error('Error deleting booking:', deleteError);
      return { success: false, error: `Failed to delete booking: ${deleteError.message}` };
    }

    // Verify the booking was actually deleted
    console.log("\nStep 3: Verifying deletion...");
    const { data: verifyBooking, error: verifyError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', booking_id)
      .maybeSingle();

    console.log("Verification result:", { verifyBooking, verifyError });

    if (verifyError) {
      console.error("Error verifying deletion:", verifyError);
      return { success: false, error: `Failed to verify deletion: ${verifyError.message}` };
    }

    if (verifyBooking) {
      console.error("Booking still exists after deletion");
      return { success: false, error: "Failed to delete booking: Booking still exists" };
    }

    console.log("\n=== deleteBooking Success ===");
    return { success: true };
  } catch (error: any) {
    console.error('\n=== deleteBooking Error ===');
    console.error('Error details:', {
      error,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return { success: false, error: error.message };
  }
}

export async function getBookingDetails(bookingId: string) {
  try {
    console.log("\n=== getBookingDetails Debug ===");
    console.log("Input parameters:", { bookingId });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First get the booking with its session instance and template
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        number_of_spots,
        session_instance:session_instances!inner (
          id,
          start_time,
          end_time,
          template:session_templates!inner (
            id,
            name,
            description,
            capacity,
            duration_minutes,
            is_open,
            is_recurring
          )
        )
      `)
      .eq("id", bookingId)
      .single()

    if (bookingError) {
      console.error("Error fetching booking:", bookingError)
      return { success: false, error: "Failed to load booking" }
    }

    if (!bookingData) {
      console.error("No booking found with ID:", bookingId)
      return { success: false, error: "Booking not found" }
    }

    console.log("Booking data found:", bookingData)

    // Type assertion for the nested structure
    type BookingWithInstance = {
      id: string;
      number_of_spots: number;
      session_instance: {
        id: string;
        start_time: string;
        end_time: string;
        template: {
          id: string;
          name: string;
          description: string | null;
          capacity: number;
          duration_minutes: number;
          is_open: boolean;
          is_recurring: boolean;
          created_at: string;
          updated_at: string;
          created_by: string;
          organization_id: string;
        };
      };
    };

    const typedBookingData = bookingData as unknown as BookingWithInstance;

    // The session_instance is now a single object, not an array
    const sessionInstance = typedBookingData.session_instance
    if (!sessionInstance) {
      console.error("No session instance found for booking")
      return { success: false, error: "Session instance not found" }
    }

    // The template is now directly accessible from the session instance
    const sessionTemplate = sessionInstance.template
    if (!sessionTemplate) {
      console.error("No session template found for instance")
      return { success: false, error: "Session template not found" }
    }

    // Transform the data to match the expected types
    const transformedSession: SessionTemplate = {
      ...sessionTemplate,
      schedules: [],
      instances: [{
        id: sessionInstance.id,
        start_time: sessionInstance.start_time,
        end_time: sessionInstance.end_time,
        status: "scheduled",
        template_id: sessionTemplate.id
      }]
    }

    return {
      success: true,
      data: {
        booking: {
          id: typedBookingData.id,
          number_of_spots: typedBookingData.number_of_spots
        },
        session: transformedSession,
        startTime: new Date(sessionInstance.start_time)
      }
    }
  } catch (error) {
    console.error("Error in getBookingDetails:", error)
    return { success: false, error: "An error occurred while loading the booking" }
  }
}

export async function getUserUpcomingBookings(userId: string): Promise<{ data: Booking[] | null; error: string | null }> {
  try {
    const supabase = createSupabaseClient()
    const now = new Date().toISOString()

    // First get the clerk_users record
    const { data: userData, error: userError } = await supabase
      .from('clerk_users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError) {
      console.error('Error getting clerk user:', userError)
      return { data: null, error: userError.message }
    }

    if (!userData) {
      console.error('No clerk user found for ID:', userId)
      return { data: null, error: 'User not found' }
    }

    // Get the bookings with their session instances
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        number_of_spots,
        session_instance:session_instances!inner (
          id,
          start_time,
          end_time,
          session_templates!inner (
            id,
            name,
            duration_minutes
          )
        )
      `)
      .eq('user_id', userData.id)
      .eq('status', 'confirmed')
      .gte('session_instance.end_time', now)

    if (error) {
      console.error('Error fetching user bookings:', error)
      return { data: null, error: error.message }
    }

    if (!bookings) {
      return { data: [], error: null }
    }

    // Type assertion for the nested structure
    type BookingWithSession = {
      id: string;
      number_of_spots: number;
      session_instance: {
        id: string;
        start_time: string;
        end_time: string;
        session_templates: {
          id: string;
          name: string;
          duration_minutes: number;
        };
      };
    };

    const typedBookings = bookings as unknown as BookingWithSession[];

    // Sort the bookings by start time
    const sortedBookings = typedBookings.sort((a, b) => 
      new Date(a.session_instance.start_time).getTime() - new Date(b.session_instance.start_time).getTime()
    )

    // Transform the data to match the Booking interface
    const transformedBookings = sortedBookings.map(booking => {
      const startTime = new Date(booking.session_instance.start_time)
      return {
        id: booking.id,
        sessionName: booking.session_instance.session_templates.name,
        date: startTime,
        time: startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        duration: `${booking.session_instance.session_templates.duration_minutes} minutes`,
        spotsBooked: booking.number_of_spots,
        sessionId: booking.session_instance.session_templates.id,
        session_instance: {
          id: booking.session_instance.id,
          start_time: booking.session_instance.start_time,
          end_time: booking.session_instance.end_time,
          session_templates: {
            id: booking.session_instance.session_templates.id,
            name: booking.session_instance.session_templates.name,
            duration_minutes: booking.session_instance.session_templates.duration_minutes
          }
        }
      }
    })

    return { data: transformedBookings, error: null }
  } catch (error) {
    console.error('Error in getUserUpcomingBookings:', error)
    return { data: null, error: error instanceof Error ? error.message : 'An error occurred' }
  }
} 