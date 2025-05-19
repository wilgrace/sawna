"use client"

import { create } from 'zustand'

type CalendarView = "list" | "calendar"

interface CalendarViewStore {
  view: CalendarView
  setView: (view: CalendarView) => void
}

export const useCalendarView = create<CalendarViewStore>((set) => ({
  view: "list",
  setView: (view) => set({ view }),
}))
