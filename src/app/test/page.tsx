import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";

export default async function TestPage() {
  const { userId } = await auth();
  const supabase = createSupabaseClient();

  // Test Supabase connection
  let supabaseTest = "❌ Failed to connect to Supabase";
  try {
    // Use a simple health check query
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      // If we get a 401, it means we connected but don't have a session
      // which is fine for testing the connection
      if (error.status === 401) {
        supabaseTest = "✅ Supabase connected successfully (no active session)";
      } else {
        supabaseTest = `❌ Supabase Error: ${error.message}`;
      }
    } else {
      supabaseTest = "✅ Supabase connected successfully";
    }
  } catch (error) {
    supabaseTest = `❌ Supabase Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Configuration Test</h1>
        
        <div className="space-y-4">
          {/* Clerk Test */}
          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold mb-2">Clerk Authentication</h2>
            <p className="text-gray-600">
              {userId 
                ? `✅ Clerk is working! User ID: ${userId}`
                : "❌ Clerk is not working - No user ID found"}
            </p>
          </div>

          {/* Supabase Test */}
          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold mb-2">Supabase Connection</h2>
            <p className="text-gray-600">{supabaseTest}</p>
          </div>

          {/* Environment Variables */}
          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold mb-2">Environment Variables</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
              </p>
              <p className="text-gray-600">
                NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}
              </p>
              <p className="text-gray-600">
                NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "✅ Set" : "❌ Missing"}
              </p>
              <p className="text-gray-600">
                CLERK_SECRET_KEY: {process.env.CLERK_SECRET_KEY ? "✅ Set" : "❌ Missing"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 