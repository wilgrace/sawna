import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { sessionTemplates, sessionSchedules, NewSessionTemplate, NewSessionSchedule } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

// These should come from your environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export async function saveSessionTemplate(
  templateData: NewSessionTemplate,
  schedulesData: NewSessionSchedule[],
  userId: string,
  templateIdToUpdate?: string,
) {
  // Basic validation
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!templateData.name || templateData.duration <= 0) {
    return { success: false, error: 'Invalid template data.' };
  }

  let savedTemplateId: string;
  let isNewTemplate = false;

  try {
    if (templateIdToUpdate) {
      // Update existing template
      const updated = await db
        .update(sessionTemplates)
        .set({
          ...templateData,
          userId,
          updatedAt: new Date(),
        })
        .where(eq(sessionTemplates.id, templateIdToUpdate))
        .returning({ id: sessionTemplates.id });

      if (!updated || updated.length === 0) {
        return { success: false, error: 'Failed to update template or template not found.' };
      }
      savedTemplateId = updated[0].id;
    } else {
      // Create new template
      const newTemplate = await db
        .insert(sessionTemplates)
        .values({
          ...templateData,
          userId,
        })
        .returning({ id: sessionTemplates.id });

      if (!newTemplate || newTemplate.length === 0) {
        return { success: false, error: 'Failed to create template.' };
      }
      savedTemplateId = newTemplate[0].id;
      isNewTemplate = true;
    }

    // --- Manage Schedules ---
    await db.delete(sessionSchedules).where(eq(sessionSchedules.templateId, savedTemplateId));

    if (schedulesData && schedulesData.length > 0) {
      const schedulesToInsert = schedulesData.map((schedule) => ({
        ...schedule,
        templateId: savedTemplateId,
      }));
      await db.insert(sessionSchedules).values(schedulesToInsert);
    }

    // --- Trigger Instance Generation ---
    console.log(`[saveSessionTemplate] Triggering instance generation for template ID: ${savedTemplateId}`);

    let instanceGenerationResult;
    if (IS_DEVELOPMENT) {
      // Call local Edge Function
      const localFunctionUrl = 'http://localhost:54321/functions/v1/generate-instances';
      try {
        const response = await fetch(localFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ template_id_to_process: savedTemplateId }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[saveSessionTemplate] Error calling local edge function:", errorText);
          instanceGenerationResult = { error: errorText };
        } else {
          const result = await response.json();
          console.log("[saveSessionTemplate] Local edge function invoked successfully:", result);
          instanceGenerationResult = result;
        }
      } catch (e) {
        console.error("[saveSessionTemplate] Failed to call local edge function:", e);
        instanceGenerationResult = { error: e instanceof Error ? e.message : String(e) };
      }
    } else {
      // Call remote Edge Function using Supabase client
      const supabaseClientForFunctions = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: functionData, error: functionError } = await supabaseClientForFunctions.functions.invoke(
        'generate-instances',
        {
          body: { template_id_to_process: savedTemplateId },
        }
      );

      if (functionError) {
        console.error(
          `[saveSessionTemplate] Error invoking remote Edge Function for template ${savedTemplateId}:`,
          functionError
        );
        instanceGenerationResult = { error: functionError.message };
      } else {
        console.log(
          `[saveSessionTemplate] Remote Edge Function invoked successfully for template ${savedTemplateId}. Response:`,
          functionData
        );
        instanceGenerationResult = functionData;
      }
    }

    // Revalidate paths to ensure fresh data is shown
    revalidatePath('/admin/calendar');
    revalidatePath('/booking');

    return {
      success: true,
      templateId: savedTemplateId,
      message: `Session template ${isNewTemplate ? 'created' : 'updated'} successfully. Instance generation ${instanceGenerationResult?.error ? 'failed' : 'triggered'}.`,
    };

  } catch (error: any) {
    console.error('[saveSessionTemplate] Error:', error);
    return { success: false, error: `An unexpected error occurred: ${error.message}` };
  }
} 