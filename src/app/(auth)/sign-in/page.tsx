// In your sign-in page component (e.g., app/sign-in/page.tsx or pages/sign-in.js)

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        routing="virtual"
        signUpUrl="/sign-up"
      />
    </div>
  );
}