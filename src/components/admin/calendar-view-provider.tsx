"use client"

import { useCalendarView } from "@/hooks/use-calendar-view"
import React from "react"

export function CalendarViewProvider({ children }: { children: React.ReactNode }) {
  const { view } = useCalendarView()
  const [calendarView, listView] = React.Children.toArray(children)

  return (
    <>
      {view === "calendar" ? calendarView : listView}
    </>
  )
}
