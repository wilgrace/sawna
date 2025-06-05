"use client"

import { SignUp } from "@clerk/nextjs"

export type SignUpPanelProps = {
  initialValues: {
    emailAddress?: string
    firstName?: string
    lastName?: string
  }
}

export default function SignUpPanel({ initialValues }: SignUpPanelProps) {
  // Define appearance inside the client component
  const appearance = {
    elements: {
      card: "shadow-none border-none",
    },
  };

  // Defensive: ensure no nulls
  const safeInitialValues = {
    emailAddress: initialValues.emailAddress || "",
    firstName: initialValues.firstName || "",
    lastName: initialValues.lastName || "",
  };

  // Debug log
  console.log("SignUpPanel initialValues:", safeInitialValues);
  console.log("Types:", {
    emailAddress: typeof safeInitialValues.emailAddress,
    firstName: typeof safeInitialValues.firstName,
    lastName: typeof safeInitialValues.lastName,
  });

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-2 text-center">Create An Account</h2>
      <ul className="mb-6 text-gray-700 space-y-2 text-sm">
        <li>• View and manage all your bookings</li>
        <li>• Get booking reminders and updates</li>
        <li>• Priority access to new locations</li>
      </ul>
      <SignUp
        routing="hash"
        fallbackRedirectUrl="/booking"
        initialValues={safeInitialValues}
        appearance={appearance}
      />
    </div>
  )
} 