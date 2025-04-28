// In your sign-in page component (e.g., app/sign-in/page.tsx or pages/sign-in.js)

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        // Change routing to "virtual"
        routing="virtual" // <--- CHANGE THIS
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard" // Or your desired redirect
        // forceRedirectUrl="/dashboard" // Or use this if needed
      />
    </div>
  );
}