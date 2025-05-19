import Link from "next/link"
import { Calendar, Home, Settings } from "lucide-react"

export function BookingSidebar() {
  return (
    <div className="w-64 border-r bg-background">
      <div className="flex h-16 items-center border-b px-4">
        <h2 className="text-lg font-semibold">Navigation</h2>
      </div>
      <nav className="space-y-1 p-4">
        <Link
          href="/booking"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          <Calendar className="h-4 w-4" />
          Book a Session
        </Link>
        <Link
          href="/home"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          <Settings className="h-4 w-4" />
          Profile
        </Link>
      </nav>
    </div>
  )
}
