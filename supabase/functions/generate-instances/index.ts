import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { addMinutes, formatISO, parseISO, getDay, set, addMonths, addDays } from "https://esm.sh/date-fns@2";
import { zonedTimeToUtc, utcToZonedTime } from 'https://esm.sh/date-fns-tz@2';

// Debug logging
console.log("Function starting...");
console.log("ENVIRONMENT:", Deno.env.get("ENVIRONMENT"));
console.log("SUPABASE_URL:", Deno.env.get("SUPABASE_URL") ? "Set" : "Not set");
console.log("SUPABASE_SERVICE_ROLE_KEY:", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "Set" : "Not set");
console.log("TIMEZONE:", Deno.env.get("TIMEZONE") ? "Set" : "Not set");

const SAUNA_TIMEZONE = Deno.env.get("TIMEZONE") || 'Europe/London'; // Configurable timezone

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

serve(async (req) => {
  console.log("Request received");
  
  // Skip authentication in development
  const isDevelopment = true; // Force development mode for now
  console.log("isDevelopment:", isDevelopment);
  
  // Skip auth check in development
  if (!isDevelopment) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log("Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401 }
      );
    }
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

    console.log("Using Supabase client with URL:", supabaseUrl);
    console.log("Environment variables:", {
      ENVIRONMENT: Deno.env.get("ENVIRONMENT"),
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "Set" : "Not set"
    });

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    console.log("Querying for templates...");
    const { data: templates, error: templateError } = await supabaseClient
      .from("session_templates")
      .select(`
        *,
        session_schedules (
          id,
          time,
          days,
          start_time_local,
          day_of_week,
          is_active
        )
      `)
      .eq("is_recurring", true)
      .eq("is_open", true);

    console.log("Raw query response:", { 
      templates: templates?.map(t => ({
        id: t.id,
        name: t.name,
        is_recurring: t.is_recurring,
        is_open: t.is_open,
        schedule_count: t.session_schedules?.length,
        schedules: t.session_schedules
      })),
      error: templateError 
    });
    
    if (templateError) {
      console.error("Error fetching templates:", templateError);
      throw templateError;
    }
    
    if (!templates || templates.length === 0) {
      console.log("No active recurring templates found to process.");
      // Let's check if there are any templates at all
      const { data: allTemplates, error: allTemplatesError } = await supabaseClient
        .from("session_templates")
        .select("*");
      
      console.log("All templates in database:", { 
        count: allTemplates?.length,
        recurringCount: allTemplates?.filter(t => t.is_recurring).length,
        openCount: allTemplates?.filter(t => t.is_open).length,
        error: allTemplatesError,
        templates: allTemplates
      });
      
      return new Response(JSON.stringify({ 
        message: "No templates to process.",
        debug: {
          totalTemplates: allTemplates?.length,
          recurringTemplates: allTemplates?.filter(t => t.is_recurring).length,
          openTemplates: allTemplates?.filter(t => t.is_open).length,
          templates: allTemplates
        }
      }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
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
      template.session_schedules.forEach((schedule: { time: string; days: string[]; start_time_local: string }, index: number) => {
        console.log(`Schedule ${index + 1} details:`, {
          time: schedule.time,
          days: schedule.days,
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

      let currentDate = generationStartDate > new Date() ? generationStartDate : new Date();
      let instancesCreated = 0;

      while (currentDate <= generationEndDate) {
        const currentDayOfWeek = getDay(currentDate);
        const dayName = intToShortDay[currentDayOfWeek];

        for (const schedule of template.session_schedules) {
          if (schedule.days.includes(dayName)) {
            const [hours, minutes] = schedule.time.split(':').map(Number);
            
            // Create local date with time
            let localDateWithTime = set(currentDate, {
              hours,
              minutes,
              seconds: 0,
              milliseconds: 0
            });

            // Convert to UTC for storage
            const instanceStartTimeUTC = zonedTimeToUtc(localDateWithTime, SAUNA_TIMEZONE);
            const instanceEndTimeUTC = addMinutes(instanceStartTimeUTC, template.duration_minutes);

            // Log the time conversion for debugging
            console.log(`Time conversion for ${template.name}:`, {
              localTime: formatISO(localDateWithTime),
              utcTime: formatISO(instanceStartTimeUTC),
              timezone: SAUNA_TIMEZONE,
              dayOfWeek: dayName,
              scheduleTime: schedule.time
            });

            // Check for existing instance
            const { data: existingInstance, error: checkError } = await supabaseClient
              .from("session_instances")
              .select("id")
              .eq("template_id", template.id)
              .eq("start_time", formatISO(instanceStartTimeUTC))
              .maybeSingle();

            if (checkError) {
              console.error(`Error checking for existing instance: ${checkError.message}`);
              continue;
            }

            if (existingInstance) {
              console.log(`Instance already exists for ${template.id} at ${formatISO(instanceStartTimeUTC)}. Skipping.`);
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
                is_exception: false
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
      message: "Instance generation complete/triggered."
    }), {
      headers: {
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("Error in generate-instances function:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }), {
      headers: {
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});