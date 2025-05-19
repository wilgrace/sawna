import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function BookingView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border p-4 hover:bg-accent/50 cursor-pointer"
            >
              <h3 className="font-semibold">Session {i}</h3>
              <p className="text-sm text-muted-foreground">
                Available time slots and details will appear here
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
