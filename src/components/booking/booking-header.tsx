import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"

interface BookingHeaderProps {
  isAdmin: boolean
}

export function BookingHeader({ isAdmin }: BookingHeaderProps) {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex-1">
          <Link href="/booking" className="text-xl font-bold">
            Community Sauna
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <SignedIn>
            {isAdmin && (
              <Link
                href="/admin/calendar"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Admin
              </Link>
            )}
            <UserButton afterSignOutUrl="/booking" />
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Sign In
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  )
}
