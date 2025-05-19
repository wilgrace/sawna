"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { SessionTemplate } from "@/types/session"

interface ListViewProps {
  templates: SessionTemplate[]
  onEditSession: (template: SessionTemplate) => void
}

export function ListView({ templates, onEditSession }: ListViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow
              key={template.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onEditSession(template)}
            >
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell>
                {template.session_instances?.[0]?.date 
                  ? new Date(template.session_instances[0].date).toLocaleDateString()
                  : "No date"}
              </TableCell>
              <TableCell>
                {template.session_instances?.[0]?.time || template.session_schedules?.[0]?.time || "No time"}
              </TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
