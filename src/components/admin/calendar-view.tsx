"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { List, LayoutGrid } from "lucide-react"
import { format } from "date-fns"

interface SessionTemplate {
  id: string
  name: string
  description?: string
  capacity: number
  duration: string
  is_open: boolean
  created_at: string
  updated_at: string
  created_by: string
  schedules?: {
    id: string
    time: string
    days: string[]
  }[]
  instances?: {
    id: string
    date: string
    time: string
  }[]
}

interface CalendarViewProps {
  templates: SessionTemplate[]
  onEditSession: (template: SessionTemplate) => void
}

export function CalendarView({ templates, onEditSession }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const getNextInstance = (template: SessionTemplate) => {
    if (template.instances && template.instances.length > 0) {
      return template.instances[0]
    }
    if (template.schedules && template.schedules.length > 0) {
      // Logic to calculate next occurrence based on schedule
      // This is a simplified version
      return {
        date: new Date().toISOString(),
        time: template.schedules[0].time
      }
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="icon" 
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "grid" ? "default" : "outline"} 
            size="icon" 
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Next Occurrence</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => {
                const nextInstance = getNextInstance(template)
                return (
                  <TableRow
                    key={template.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onEditSession(template)}
                  >
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      {nextInstance ? format(new Date(nextInstance.date), "PPP") : "No upcoming sessions"}
                    </TableCell>
                    <TableCell>{nextInstance?.time || "N/A"}</TableCell>
                    <TableCell>{template.capacity}</TableCell>
                    <TableCell>
                      <Badge variant={template.is_open ? "success" : "secondary"}>
                        {template.is_open ? "Open" : "Closed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const nextInstance = getNextInstance(template)
            return (
              <div
                key={template.id}
                className="border rounded-lg p-4 cursor-pointer hover:shadow-md"
                onClick={() => onEditSession(template)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{template.name}</h3>
                  <Badge variant={template.is_open ? "success" : "secondary"}>
                    {template.is_open ? "Open" : "Closed"}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>
                    {nextInstance 
                      ? `${format(new Date(nextInstance.date), "PPP")} at ${nextInstance.time}`
                      : "No upcoming sessions"}
                  </p>
                  <p className="mt-1">Capacity: {template.capacity}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
