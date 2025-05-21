export interface Session {
  id: string
  name: string
  description?: string
  capacity: number
  duration: string
  is_open: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export interface SessionSchedule {
  id: string
  session_id: string
  time: string
  days: string[]
  is_recurring: boolean
  date?: string
  created_at: string
  updated_at: string
}

export interface SessionTemplate {
  id: string
  name: string
  description?: string
  capacity: number
  duration_minutes: number
  is_open: boolean
  is_recurring: boolean
  one_off_start_time?: string
  recurrence_start_date?: string
  recurrence_end_date?: string
  created_at: string
  updated_at: string
  created_by: string
  organization_id?: string
  schedules?: SessionSchedule[]
  instances?: SessionInstance[]
}

export interface SessionInstance {
  id: string
  start_time: string
  end_time: string
} 