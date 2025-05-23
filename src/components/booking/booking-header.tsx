import { UserButton } from "@clerk/nextjs"
import Link from "next/link"

interface BookingHeaderProps {
  isAuthenticated: boolean
  isAdmin: boolean
}

export function BookingHeader({ isAuthenticated, isAdmin }: BookingHeaderProps) {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex-1">
          <Link href="/booking" className="text-xl font-bold">
            Community Sauna
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/admin/calendar"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Admin
              </Link>
              <UserButton afterSignOutUrl="/booking" />
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
