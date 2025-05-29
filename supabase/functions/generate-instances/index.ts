import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from "https://cdn.skypack.dev/date-fns-tz@2.0.0";
import { addDays, format, parseISO, startOfDay, formatISO } from "https://esm.sh/date-fns@2.30.0";
import { addMinutes, getDay, set, addMonths } from "https://esm.sh/date-fns@2.30.0";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from '../_shared/cors.ts';

// Debug logging
console.log("Function starting...");
console.log("ENVIRONMENT:", Deno.env.get("ENVIRONMENT") || "development");
console.log("DB_URL:", Deno.env.get("DB_URL") ? "Set" : "Not set");
console.log("SERVICE_ROLE_KEY:", Deno.env.get("SERVICE_ROLE_KEY") ? "Set" : "Not set");
console.log("TIMEZONE:", Deno.env.get("TIMEZONE") ? "Set" : "Not set");

const SAUNA_TIMEZONE = Deno.env.get("TIMEZONE") || 'Europe/London'; // Configurable timezone
const DB_URL = Deno.env.get("DB_URL") || "http://kong:8000";
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Import day utilities
const intToShortDay: Record<number, string> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat'
};

// Add UUID validation function
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

interface SessionTemplate {
  id: string;
  name: string;
  is_recurring: boolean;
  is_open: boolean;
  schedules: SessionSchedule[];
  recurrence_start_date: string | null;
  recurrence_end_date: string | null;
  duration_minutes: number;
  created_by: string;
  organization_id: string;
}

interface SessionSchedule {
  id: string;
  day_of_week: number;
  time: string;
  start_time_local: string;
  is_active: boolean;
}

// Helper function to convert local time to UTC
function localToUTC(date: Date, timezone: string): Date {
  // Parse the timezone offset
  const timeZoneDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offset = timeZoneDate.getTime() - utcDate.getTime();
  
  // Apply the offset to get the correct UTC time
  return new Date(date.getTime() - offset);
}

// Helper function to convert UTC to local time
function utcToLocal(date: Date, timezone: string): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: timezone }))
}

// Create a custom serve function that bypasses auth
const serveWithoutAuth = (handler: (req: Request) => Promise<Response>) => {
  return serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const response = await handler(req);
      // Ensure CORS headers are added to all responses
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error("Error in handler:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  });
};

serveWithoutAuth(async (req) => {
  console.log("Request received");
  
  // Check if a specific template_id is passed in the request body
  let specificTemplateIdToProcess: string | null = null;
  if (req.body) {
    try {
      const body = await req.json();
      if (body && body.template_id_to_process) {
        specificTemplateIdToProcess = body.template_id_to_process;
        console.log(`Received request to process specific template ID: ${specificTemplateIdToProcess}`);
        
        // Validate UUID format if we have a template ID
        if (specificTemplateIdToProcess && !isValidUUID(specificTemplateIdToProcess)) {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid template ID format. Expected a valid UUID.',
              received: specificTemplateIdToProcess
            }),
            { 
              status: 400,
              headers: { 
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      }
    } catch (e: unknown) {
      console.warn("Could not parse request body for specific template ID:", e instanceof Error ? e.message : String(e));
      // Continue to process all if body is not as expected or not present
    }
  }

  try {
    const supabaseUrl = DB_URL;
    const supabaseKey = SERVICE_ROLE_KEY;

    console.log("Using Supabase client with URL:", supabaseUrl);
    console.log("Environment variables:", {
      ENVIRONMENT: "development",
      DB_URL: DB_URL,
      SERVICE_ROLE_KEY: "Set"
    });

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Build the query
    let query = supabaseClient
      .from("session_templates")
      .select(`
        *,
        session_schedules!session_schedules_session_template_id_fkey (
          id,
          time,
          day_of_week,
          start_time_local,
          is_active
        ),
        created_by,
        organization_id
      `)
      .eq("is_recurring", true)
      .eq("is_open", true);

    // If a specific template ID is provided, only process that one
    if (specificTemplateIdToProcess) {
      query = query.eq("id", specificTemplateIdToProcess);
    }

    console.log("Querying for templates...");
    const { data: templates, error: templateError } = await query;

    console.log("Raw query response:", { 
      templates: templates?.map(t => ({
        id: t.id,
        name: t.name,
        is_recurring: t.is_recurring,
        is_open: t.is_open,
        schedule_count: t.session_schedules?.length,
        schedules: t.session_schedules?.map((s: SessionSchedule) => ({
          id: s.id,
          time: s.time,
          day_of_week: s.day_of_week,
          start_time_local: s.start_time_local,
          is_active: s.is_active
        }))
      })),
      error: templateError 
    });
    
    if (templateError) {
      console.error("Error fetching templates:", templateError);
      throw templateError;
    }
    
    if (!templates || templates.length === 0) {
      const message = specificTemplateIdToProcess
        ? `Template ID ${specificTemplateIdToProcess} not found or not active/recurring.`
        : "No active recurring templates found to process.";
      console.log(message);
      return new Response(JSON.stringify({ message }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // If processing a specific template, handle deletion of future instances
    if (specificTemplateIdToProcess) {
      console.log(`Processing specific template: ${specificTemplateIdToProcess}. Handling future instances...`);
      const todayISO = new Date().toISOString();

      // First, get all future instances for this template
      const { data: futureInstances, error: fetchError } = await supabaseClient
        .from("session_instances")
        .select(`
          id,
          start_time,
          bookings (
            id
          )
        `)
        .eq("template_id", specificTemplateIdToProcess)
        .gte("start_time", todayISO);

      if (fetchError) {
        console.error(`Error fetching future instances for template ${specificTemplateIdToProcess}:`, fetchError.message);
      } else {
        // Separate instances into booked and unbooked
        const bookedInstanceIds = futureInstances
          ?.filter(instance => instance.bookings && instance.bookings.length > 0)
          .map(instance => instance.id) || [];

        const unbookedInstanceIds = futureInstances
          ?.filter(instance => !instance.bookings || instance.bookings.length === 0)
          .map(instance => instance.id) || [];

        console.log(`Found ${futureInstances?.length || 0} future instances:`, {
          booked: bookedInstanceIds.length,
          unbooked: unbookedInstanceIds.length
        });

        // Delete unbooked instances
        if (unbookedInstanceIds.length > 0) {
          const { error: deleteError } = await supabaseClient
            .from("session_instances")
            .delete()
            .in("id", unbookedInstanceIds);

          if (deleteError) {
            console.error(`Error deleting unbooked instances for template ${specificTemplateIdToProcess}:`, deleteError.message);
          } else {
            console.log(`Successfully deleted ${unbookedInstanceIds.length} unbooked future instances for template ${specificTemplateIdToProcess}`);
          }
        }

        // Log booked instances that were preserved
        if (bookedInstanceIds.length > 0) {
          console.log(`Preserved ${bookedInstanceIds.length} booked future instances for template ${specificTemplateIdToProcess}`);
        }
      }
    }

    console.log(`Found ${templates.length} templates to process`);
    console.log("Template details:", templates.map(t => ({
      id: t.id,
      name: t.name,
      is_recurring: t.is_recurring,
      is_open: t.is_open,
      schedules: t.session_schedules,
      recurrence_start_date: t.recurrence_start_date,
      recurrence_end_date: t.recurrence_end_date
    })));
    const generationLookAheadMonths = 3;

    for (const template of templates) {
      console.log(`Processing template: ${template.name} (ID: ${template.id})`);
      console.log('Template details:', {
        is_recurring: template.is_recurring,
        is_open: template.is_open,
        recurrence_start_date: template.recurrence_start_date,
        recurrence_end_date: template.recurrence_end_date,
        schedules: template.session_schedules,
        duration_minutes: template.duration_minutes
      });

      if (!template.session_schedules || template.session_schedules.length === 0) {
        console.log(`Template ${template.id} has no schedules.`);
        continue;
      }

      // Log each schedule's details
      template.session_schedules.forEach((schedule: { time: string; day_of_week: number; start_time_local: string }, index: number) => {
        console.log(`Schedule ${index + 1} details:`, {
          time: schedule.time,
          day_of_week: schedule.day_of_week,
          start_time_local: schedule.start_time_local
        });
      });

      const generationStartDate = template.recurrence_start_date 
        ? parseISO(template.recurrence_start_date) 
        : new Date();
      const generationEndDate = template.recurrence_end_date
        ? parseISO(template.recurrence_end_date)
        : addMonths(new Date(), generationLookAheadMonths);

      console.log('Generation date range:', {
        start: formatISO(generationStartDate),
        end: formatISO(generationEndDate),
        daysToGenerate: Math.ceil((generationEndDate.getTime() - generationStartDate.getTime()) / (1000 * 60 * 60 * 24))
      });

      // Find the first occurrence of any schedule's day after the start date
      let currentDate = generationStartDate;
      const scheduleDays = template.session_schedules.map((s: SessionSchedule) => s.day_of_week);
      
      // If the start date's day is not in the schedule days, find the next occurrence
      while (!scheduleDays.includes(getDay(currentDate))) {
        currentDate = addDays(currentDate, 1);
      }

      let instancesCreated = 0;

      while (currentDate <= generationEndDate) {
        const currentDayOfWeekInteger = getDay(currentDate);
        const currentDayName = intToShortDay[currentDayOfWeekInteger];
        
        for (const schedule of template.session_schedules) {
          const matchesDay = schedule.day_of_week === currentDayOfWeekInteger;
          
          if (matchesDay) {
            // Parse the local time from the schedule
            const [hours, minutes] = schedule.start_time_local.split(':').map(Number);
            
            // Create local date with time
            let localDateWithTime = set(currentDate, {
              hours,
              minutes,
              seconds: 0,
              milliseconds: 0
            });

            // Convert to UTC using the timezone
            const instanceStartTimeUTC = localToUTC(localDateWithTime, SAUNA_TIMEZONE);
            const instanceEndTimeUTC = addMinutes(instanceStartTimeUTC, template.duration_minutes);

            // Log the time conversion for debugging
            console.log(`Time conversion for ${template.name}:`, {
              localTime: formatISO(localDateWithTime),
              utcTime: formatISO(instanceStartTimeUTC),
              timezone: SAUNA_TIMEZONE,
              dayOfWeek: currentDayOfWeekInteger,
              dayName: currentDayName,
              scheduleTime: schedule.start_time_local
            });

            // Check if an instance already exists for this time
            const { data: existingInstance, error: checkError } = await supabaseClient
              .from("session_instances")
              .select("id, start_time, end_time")
              .eq("template_id", template.id)
              .eq("start_time", formatISO(instanceStartTimeUTC))
              .single();

            if (checkError && checkError.code !== 'PGRST116') {
              console.error(`Error checking for existing instance: ${checkError.message}`);
              continue;
            }

            if (existingInstance) {
              console.log(`Instance already exists for ${template.id} at ${formatISO(instanceStartTimeUTC)}`);
              continue;
            }

            // Create new instance
            const { error: insertError } = await supabaseClient
              .from("session_instances")
              .insert({
                template_id: template.id,
                start_time: formatISO(instanceStartTimeUTC),
                end_time: formatISO(instanceEndTimeUTC),
                status: "scheduled",
                organization_id: template.organization_id
              });

            if (insertError) {
              console.error(`Error creating instance: ${insertError.message}`);
              continue;
            }

            console.log(`Created instance for ${template.id} at ${formatISO(instanceStartTimeUTC)}`);
            instancesCreated++;
          }
        }
        currentDate = addDays(currentDate, 1);
      }
      console.log(`Finished processing template ${template.id}. Created ${instancesCreated} instances.`);
    }

    console.log(`Successfully processed all templates`);
    return new Response(JSON.stringify({
      message: "Instance generation complete/triggered.",
      processedTemplateId: specificTemplateIdToProcess
    }), {
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
      status: 200
    });
  } catch (error) {
    console.error("Error in generate-instances function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred",
      processedTemplateId: specificTemplateIdToProcess
    }), {
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
      status: 500
    });
  }
});

async function processTemplate(template: SessionTemplate, supabase: SupabaseClient) {
  console.log("Processing template:", template.name, "(ID:", template.id, ")")
  
  // Add retry logic for fetching schedules
  let retryCount = 0;
  const maxRetries = 3;
  let schedules: SessionSchedule[] = [];
  
  while (retryCount < maxRetries) {
    try {
      // Query for schedules
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('session_schedules')
        .select('*')
        .eq('session_template_id', template.id);

      if (scheduleError) {
        console.error("Error fetching schedules:", scheduleError);
        throw scheduleError;
      }

      schedules = scheduleData || [];
      
      if (schedules.length > 0) {
        console.log("Found schedules:", schedules);
        break;
      }

      if (retryCount < maxRetries - 1) {
        console.log(`No schedules found, retrying in 2 seconds... (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      retryCount++;
    } catch (error) {
      console.error("Error in schedule fetch attempt:", error);
      if (retryCount < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
      } else {
        throw error;
      }
    }
  }

  if (schedules.length === 0) {
    console.log(`Template ${template.id} has no schedules after ${maxRetries} attempts.`);
    return;
  }

  // Rest of the existing processTemplate function...
  // ... existing code ...
}