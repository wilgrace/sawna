"use client";

import { SessionDetails } from "@/components/booking/session-details";
import { CheckCircle } from "lucide-react";
import SignUpPanel from "./SignUpPanel";

export default function ConfirmationClient({
  session,
  startTime,
  signUpInitialValues,
}: {
  session: any;
  startTime: Date | string;
  signUpInitialValues: {
    emailAddress?: string;
    firstName?: string;
    lastName?: string;
  };
}) {
  // Ensure startTime is a Date or undefined
  const parsedStartTime =
    typeof startTime === "string"
      ? new Date(startTime)
      : startTime;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Booking Details */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-7 w-7 text-green-500" />
            <span className="text-lg font-semibold text-green-700">
              Booking Confirmed!
            </span>
          </div>
          <SessionDetails session={session} startTime={parsedStartTime || undefined} />
        </div>
        {/* Right: Clerk SignUp + Benefits */}
        <div className="flex flex-col items-center justify-center h-full w-full">
          <SignUpPanel initialValues={signUpInitialValues} />
        </div>
      </div>
    </div>
  );
} 