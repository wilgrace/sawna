"use client"

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Profile } from "@/types/profile";
import { UserForm } from "@/components/admin/user-form";

interface UsersPageProps {
  initialUsers: Profile[];
}

export function UsersPage({ initialUsers }: UsersPageProps) {
  const [users, setUsers] = useState(initialUsers);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {!users || users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email address</TableHead>
                  <TableHead>Clerk user ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserForm(true);
                    }}
                  >
                    <TableCell className="font-medium">{[user.first_name, user.last_name].filter(Boolean).join(" ")}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.clerk_user_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <UserForm
        open={showUserForm}
        onClose={() => {
          setShowUserForm(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => {
          // Refresh the page to get new data
          window.location.reload();
        }}
      />
    </div>
  );
} 