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
  duration: string
  is_open: boolean
  created_at: string
  updated_at: string
  created_by: string
  session_schedules?: {
    id: string
    time: string
    days: string[]
  }[]
  session_instances?: {
    id: string
    date: string
    time: string
  }[]
} 