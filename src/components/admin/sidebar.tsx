"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Calendar, Users, Settings, ChevronDown, ChevronRight, ExternalLink, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { UserButton } from "@clerk/nextjs"

export function Sidebar() {
  const pathname = usePathname()
  const [isSettingsOpen, setIsSettingsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navItems = [
    { href: "/admin", icon: Home, label: "Home" },
    { href: "/admin/calendar", icon: Calendar, label: "Calendar" },
    { href: "/admin/users", icon: Users, label: "Users" },
  ]

  const settingsItems = [
    { href: "/settings/general", label: "General" },
    { href: "/settings/pricing", label: "Pricing" },
    { href: "/settings/design", label: "Design" },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                pathname === item.href
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          ))}

          <div className="pt-2">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md",
                pathname.startsWith("/settings")
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
              {isSettingsOpen ? (
                <ChevronDown className="ml-auto h-4 w-4" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </button>

            {isSettingsOpen && (
              <div className="ml-8 mt-1 space-y-1">
                {settingsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      pathname === item.href
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4">
        <Link
          href="/booking"
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <ExternalLink className="mr-3 h-5 w-5" />
          Booking Page
        </Link>
        <div className="flex items-center mt-4 px-3">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 z-50"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Button variant="ghost" size="icon" className="absolute top-3 right-3" onClick={() => setIsMobileOpen(false)}>
            <X className="h-6 w-6" />
            <span className="sr-only">Close sidebar</span>
          </Button>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
