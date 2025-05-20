"use client"

import { useState } from "react"
import { CalendarView } from "@/components/admin/calendar-view"
import { ListView } from "@/components/admin/list-view"
import { SessionForm } from "@/components/admin/session-form"
import { SessionTemplate } from "@/types/session"

interface CalendarPageProps {
  initialSessions: SessionTemplate[]
}

export function CalendarPage({ initialSessions }: CalendarPageProps) {
  const [sessions, setSessions] = useState(initialSessions)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionTemplate | null>(null)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        <button
          onClick={() => setShowSessionForm(true)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          New Session
        </button>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No sessions found. Click "New Session" to create one.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <CalendarView 
            sessions={sessions} 
            onEditSession={(session) => {
              setSelectedSession(session)
              setShowSessionForm(true)
            }}
          />
          <ListView 
            sessions={sessions}
            onEditSession={(session) => {
              setSelectedSession(session)
              setShowSessionForm(true)
            }}
          />
        </div>
      )}

      <SessionForm
        open={showSessionForm}
        onClose={() => {
          setShowSessionForm(false)
          setSelectedSession(null)
        }}
        template={selectedSession}
        onSuccess={() => {
          // Refresh the page to get new data
          window.location.reload()
        }}
      />
    </div>
  )
} 