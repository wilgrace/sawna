import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Dashboard() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Sauna Booking Dashboard</h1>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome to your dashboard</h2>
          <p className="mb-4">User ID: {userId}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Booking Card */}
            <div className="border rounded-lg p-6 bg-blue-50">
              <h3 className="font-medium text-lg mb-2">Manage Bookings</h3>
              <p className="text-gray-600 mb-4">View and manage your sauna bookings</p>
              <Link 
                href="/bookings" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Bookings →
              </Link>
            </div>
            
            {/* Organization Card */}
            <div className="border rounded-lg p-6 bg-green-50">
              <h3 className="font-medium text-lg mb-2">Organization Settings</h3>
              <p className="text-gray-600 mb-4">Manage your organization details</p>
              <Link 
                href="/organization" 
                className="text-green-600 hover:text-green-800 font-medium"
              >
                Manage Organization →
              </Link>
            </div>
            
            {/* Profile Card */}
            <div className="border rounded-lg p-6 bg-purple-50">
              <h3 className="font-medium text-lg mb-2">Account Settings</h3>
              <p className="text-gray-600 mb-4">Update your profile and preferences</p>
              <Link 
                href="/profile" 
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Edit Profile →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 