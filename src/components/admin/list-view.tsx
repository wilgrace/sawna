"use client"

import { SessionTemplate } from "@/types/session"

interface ListViewProps {
  sessions: SessionTemplate[]
  onEditSession: (session: SessionTemplate) => void
}

export function ListView({ sessions, onEditSession }: ListViewProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4">
        <h3 className="text-lg font-medium">List View</h3>
        <div className="mt-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-2 border rounded mb-2 cursor-pointer hover:bg-gray-50"
              onClick={() => onEditSession(session)}
            >
              <h4 className="font-medium">{session.name}</h4>
              <p className="text-sm text-gray-500">{session.description}</p>
              <div className="text-sm text-gray-500">
                Capacity: {session.capacity} | Duration: {session.duration_minutes} minutes
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
