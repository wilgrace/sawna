"use client"

import { SignUp } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { dark } from "@clerk/themes"

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
      cardBox: "shadow-none border-none",
      formButtonPrimary: "bg-sky-500 text-white hover:bg-sky-600",
      formFieldInput: "bg-white text-slate-950 border-slate-200",
      formFieldLabel: "text-slate-950",
      formFieldAction: "text-sky-500 hover:text-sky-600",
      footerActionLink: "text-sky-500 hover:text-sky-600",
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

  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [waiting, setWaiting] = useState(false);
  const [waitError, setWaitError] = useState<string | null>(null);

  useEffect(() => {
    // Only run after Clerk user is loaded and signed in
    if (!isLoaded || !user) return;
    let cancelled = false;
    async function waitForUpgrade() {
      setWaiting(true);
      setWaitError(null);
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      // Only proceed if user is defined
      if (!user) return;
      const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
      const clerkUserId = user.id;
      let tries = 0;
      while (tries < 20) { // Try for up to 10 seconds (20 x 500ms)
        const { data, error } = await supabase
          .from("clerk_users")
          .select("id")
          .eq("email", email)
          .eq("clerk_user_id", clerkUserId)
          .maybeSingle();
        if (data && data.id) {
          if (!cancelled) {
            router.push("/booking");
          }
          return;
        }
        await new Promise((res) => setTimeout(res, 500));
        tries++;
      }
      if (!cancelled) {
        setWaitError("Your account is taking longer than expected to upgrade. Please refresh or try again in a moment.");
        setWaiting(false);
      }
    }
    waitForUpgrade();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, router]);

  return (
    <div className="w-full max-w-md bg-white rounded-lg p-6 mb-6">
      <SignUp
        routing="hash"
        fallbackRedirectUrl="/booking"
        initialValues={safeInitialValues}
        appearance={appearance}
      />
      {waiting && (
        <div className="flex flex-col items-center mt-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mb-2"></div>
          <div className="text-slate-600 text-sm">Finalizing your account…</div>
        </div>
      )}
      {waitError && (
        <div className="mt-4 text-red-600 text-sm text-center">{waitError}</div>
      )}
    </div>
  )
} 