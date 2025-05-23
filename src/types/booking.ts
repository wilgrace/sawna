export interface Booking {
  id: string
  sessionName: string
  date: Date
  time: string
  duration: string
  spotsBooked: number
  sessionId: string
  session_instance: {
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