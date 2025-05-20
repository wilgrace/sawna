import { getSessionTemplates } from "@/app/actions/session"
import { CalendarPage } from "@/components/admin/calendar-page"

export default async function Page() {
  const { data: templates, error } = await getSessionTemplates()

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="text-red-500">Error loading templates: {error}</div>
      </div>
    )
  }

  return <CalendarPage initialTemplates={templates || []} />
}
