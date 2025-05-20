import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { addMinutes, formatISO, parseISO, getDay, isWithinInterval, set, addMonths, addDays } from "https://esm.sh/date-fns@2"; // date-fns for date manipulation
import { utcToZonedTime, zonedTimeToUtc } from 'https://esm.sh/date-fns-tz@2';

const SAUNA_TIMEZONE = 'Europe/London'; // IMPORTANT: Set your sauna's local timezone

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
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // Use service role for backend operations
    );


    const { data: templates, error: templateError } = await supabaseClient
      .from("session_templates")
      .select(`
        *,
        session_schedules (
          time,
          days
        )
      `)
      .eq("is_recurring", true)
      .eq("is_open", true); // Only process open templates

    if (templateError) throw templateError;
    if (!templates || templates.length === 0) {
      console.log("No active recurring templates found to process.");
      return new Response("No templates to process.", { status: 200 });
    }

    console.log(`Found ${templates.length} templates to process`);

    const generationLookAheadMonths = 3;

    for (const template of templates) {
      console.log(`Processing template: ${template.name} (ID: ${template.id})`);
      if (!template.session_schedules || template.session_schedules.length === 0) {
        console.log(`Template ${template.id} has no schedules.`);
        continue;
      }

      const generationStartDate = template.recurrence_start_date 
        ? parseISO(template.recurrence_start_date) 
        : new Date();
      const generationEndDate = template.recurrence_end_date
        ? parseISO(template.recurrence_end_date)
        : addMonths(new Date(), generationLookAheadMonths);

      let currentDate = generationStartDate > new Date() ? generationStartDate : new Date();

      while (currentDate <= generationEndDate) {
        const currentDayOfWeek = getDay(currentDate);
        const dayName = intToShortDay[currentDayOfWeek];

        for (const schedule of template.session_schedules) {
          if (schedule.days.includes(dayName)) {
            const [hours, minutes] = schedule.time.split(':').map(Number);
            let localDateWithTime = set(currentDate, { hours, minutes, seconds: 0, milliseconds: 0 });

            const instanceStartTimeUTC = zonedTimeToUtc(localDateWithTime, SAUNA_TIMEZONE);
            const instanceEndTimeUTC = addMinutes(instanceStartTimeUTC, template.duration_minutes);

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

            const { error: insertError } = await supabaseClient
              .from("session_instances")
              .insert({
                template_id: template.id,
                start_time: formatISO(instanceStartTimeUTC),
                end_time: formatISO(instanceEndTimeUTC),
                status: "scheduled",
                is_exception: false,
              });

            if (insertError) {
              console.error(`Error creating instance: ${insertError.message}`);
              continue;
            }

            console.log(`Created instance for ${template.id} at ${formatISO(instanceStartTimeUTC)}`);
          }
        }
        currentDate = addDays(currentDate, 1);
      }
      console.log(`Finished processing template ${template.id}`);
    }

    console.log(`Successfully processed all templates`);

    return new Response(JSON.stringify({ message: "Instance generation complete/triggered." }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in generate-instances function:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});