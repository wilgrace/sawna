"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, Users, Settings } from "lucide-react"
import { UserButtonSection } from "./user-button-section"

export function SidebarContent() {
  const pathname = usePathname()

  const links = [
    {
      href: "/admin/calendar",
      label: "Calendar",
      icon: Calendar,
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                pathname === link.href
                  ? "bg-muted text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </div>
      <UserButtonSection />
    </div>
  )
} 