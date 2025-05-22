"use client"

import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { SessionTemplate } from "@/types/session"

interface SessionDetailsProps {
  session: SessionTemplate
  startTime?: Date
}

export function SessionDetails({ session, startTime }: SessionDetailsProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{session.name}</h2>
            {startTime && (
              <p className="text-muted-foreground">
                {format(startTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            )}
          </div>

          <div className="prose prose-sm">
            <p>{session.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
              <p>{session.duration_minutes} minutes</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Capacity</h3>
              <p>{session.capacity} people</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <p>{session.is_open ? "Open" : "Closed"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 