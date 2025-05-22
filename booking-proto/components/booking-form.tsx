"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, CreditCard, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface BookingFormProps {
  session: {
    id: string
    title: string
    price: {
      communal: number
      private: number
    }
  }
}

export function BookingForm({ session }: BookingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggedIn] = useState(false)
  const [bookingType, setBookingType] = useState<"communal" | "private">("communal")
  const [visitors, setVisitors] = useState(1)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const price = bookingType === "communal" ? session.price.communal * visitors : session.price.private

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      })
      return
    }

    // In a real app, you would submit to your backend here

    // Navigate to confirmation page
    router.push(`/booking/${session.id}/confirmation`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="booking-type">Booking Type</Label>
            <RadioGroup
              id="booking-type"
              value={bookingType}
              onValueChange={(value) => setBookingType(value as "communal" | "private")}
              className="grid grid-cols-1 gap-3"
            >
              <Label
                htmlFor="communal"
                className="flex flex-col space-y-1 rounded-md border p-4 cursor-pointer [&:has(:checked)]:bg-muted"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="communal" value="communal" />
                  <span className="font-medium">Communal Session</span>
                </div>
                <span className="text-sm text-muted-foreground pl-6">${session.price.communal} per person</span>
              </Label>
              <Label
                htmlFor="private"
                className="flex flex-col space-y-1 rounded-md border p-4 cursor-pointer [&:has(:checked)]:bg-muted"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="private" value="private" />
                  <span className="font-medium">Private Session</span>
                </div>
                <span className="text-sm text-muted-foreground pl-6">
                  ${session.price.private} flat rate (up to 4 people)
                </span>
              </Label>
            </RadioGroup>
          </div>

          {/* Visitors Counter */}
          <div className="space-y-3">
            <Label htmlFor="visitors">Number of Visitors</Label>
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setVisitors(Math.max(1, visitors - 1))}
                disabled={visitors <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-12 text-center font-medium">{visitors}</div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setVisitors(Math.min(bookingType === "private" ? 4 : 8, visitors + 1))}
                disabled={(bookingType === "private" && visitors >= 4) || (bookingType === "communal" && visitors >= 8)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* User Information */}
          {isLoggedIn ? (
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">John Doe</span>
              </div>
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                <span>Visa ending in 4242</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your Name" required />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I accept the terms and conditions and waiver
                </Label>
              </div>
            </div>
          )}

          {/* Membership Upsell */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-medium mb-2">Become a Member</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get 20% off all bookings and priority access to events.
            </p>
            <Button variant="outline" type="button" className="w-full">
              Learn More
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="flex justify-between w-full">
            <span className="font-medium">Total</span>
            <span className="font-bold">${price.toFixed(2)}</span>
          </div>
          <Button type="submit" className="w-full">
            Pay ${price.toFixed(2)}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
