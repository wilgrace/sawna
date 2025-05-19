import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function BookingForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Book a Session</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input id="time" type="time" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" type="text" placeholder="Any special requirements?" />
          </div>
          <Button type="submit" className="w-full">
            Book Session
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
