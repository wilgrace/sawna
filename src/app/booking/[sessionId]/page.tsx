import { Suspense } from "react"
import { SessionPageClient } from "./session-page-client"
import { redirect } from "next/navigation"

interface SessionPageProps {
  params: Promise<{
    sessionId: string
  }>
  searchParams: Promise<{
    start?: string
    edit?: string
    bookingId?: string
  }>
}

export default async function SessionPage({ params, searchParams }: SessionPageProps) {
  // Await both params and searchParams
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams])
  
  // Validate sessionId
  if (!resolvedParams.sessionId) {
    redirect('/booking')
  }

  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading session details...</p>
          </div>
        </div>
      </div>
    }>
      <SessionPageClient 
        sessionId={resolvedParams.sessionId} 
        searchParams={resolvedSearchParams} 
      />
    </Suspense>
  )
} 