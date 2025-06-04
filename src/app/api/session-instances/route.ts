import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey);
};

interface SessionTemplate {
  id: string;
  name: string;
  duration_minutes: number;
}

interface SessionInstance {
  id: string;
  template_id: string;
  start_time: string;
  end_time: string;
  status: string;
  session_templates: {
    name: string;
    duration_minutes: number;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Get all session templates that are open for booking
    const { data: templates, error: templatesError } = await supabase
      .from('session_templates')
      .select('id, name, duration_minutes')
      .eq('is_open', true);

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return NextResponse.json(
        { error: 'Failed to fetch session templates' },
        { status: 500 }
      );
    }

    if (!templates || templates.length === 0) {
      return NextResponse.json([]);
    }

    const templateIds = templates.map((t: SessionTemplate) => t.id);

    // Get instances for these templates within the date range
    const { data: instances, error: instancesError } = await supabase
      .from('session_instances')
      .select(`
        id,
        template_id,
        start_time,
        end_time,
        status,
        session_templates (
          name,
          duration_minutes
        )
      `)
      .in('template_id', templateIds)
      .gte('start_time', start)
      .lte('end_time', end)
      .eq('status', 'scheduled')
      .order('start_time', { ascending: true });

    if (instancesError) {
      console.error('Error fetching instances:', instancesError);
      return NextResponse.json(
        { error: 'Failed to fetch session instances' },
        { status: 500 }
      );
    }

    // Transform the data to match the calendar event format
    const events: CalendarEvent[] = (instances || []).map(instance => {
      const typedInstance = instance as unknown as SessionInstance;
      return {
        id: typedInstance.id,
        title: typedInstance.session_templates.name,
        start: typedInstance.start_time,
        end: typedInstance.end_time,
      };
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error in session-instances API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 