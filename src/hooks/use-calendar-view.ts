"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CalendarView = "list" | "calendar"

interface CalendarViewStore {
  view: CalendarView
  setView: (view: CalendarView) => void
}

export const useCalendarView = create<CalendarViewStore>()(
  persist(
    (set) => ({
      view: "calendar",
      setView: (view) => set({ view }),
    }),
    {
      name: 'calendar-view',
    }
  )
)
