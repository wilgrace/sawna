import { listClerkUsers } from "@/app/actions/clerk";
import { UsersPage } from "@/components/admin/users-page";

export default async function Page() {
  const { users, error } = await listClerkUsers();

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="text-red-500">Error loading users: {error}</div>
      </div>
    );
  }

  return <UsersPage initialUsers={users || []} />;
} 