import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminControls() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button variant="outline">Manage Sessions</Button>
            <Button variant="outline">View Bookings</Button>
            <Button variant="outline">Settings</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Admin controls and session management tools will appear here
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
