import { Suspense } from "react"
import { SessionPageClient } from "./session-page-client"

interface SessionPageProps {
  params: {
    sessionId: string
  }
  searchParams: {
    start?: string
  }
}

export default function SessionPage({ params, searchParams }: SessionPageProps) {
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
      <SessionPageClient params={params} searchParams={searchParams} />
    </Suspense>
  )
} 