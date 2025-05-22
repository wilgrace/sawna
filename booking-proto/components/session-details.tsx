import Image from "next/image"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent } from "@/components/ui/card"

interface SessionDetailsProps {
  session: {
    title: string
    description: string
    date: string
    image: string
  }
}

export function SessionDetails({ session }: SessionDetailsProps) {
  const sessionDate = new Date(session.date)

  return (
    <Card className="overflow-hidden">
      <div className="relative h-64 w-full">
        <Image src={session.image || "/placeholder.svg"} alt={session.title} fill className="object-cover" priority />
      </div>
      <CardContent className="p-6">
        <h1 className="text-2xl font-bold mb-2 hidden md:block">{session.title}</h1>
        <p className="text-muted-foreground mb-4">{session.description}</p>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{format(sessionDate, "EEEE, MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{format(sessionDate, "h:mm a")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
