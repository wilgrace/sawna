import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Community Sauna",
  description: "Book your sessions",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider
          signInFallbackRedirectUrl="/booking"
          signUpFallbackRedirectUrl="/booking"
        >
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
        <Toaster />
      </body>
    </html>
  )
}
