import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Map role values to display labels
const ROLE_LABELS: Record<string, string> = {
  'org:super_admin': 'Super Admin',
  'org:admin': 'Admin',
  'org:user': 'User'
};

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get users from Supabase
    const { data: supabaseUsers, error } = await supabase
      .from("clerk_users")
      .select("*");

    if (error) {
      console.error("Error listing clerk users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get organization memberships from Clerk
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID;
    if (!organizationId) {
      console.error("DEFAULT_ORGANIZATION_ID is not set");
      return NextResponse.json({ error: "Organization ID not configured" }, { status: 500 });
    }

    const memberships = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId
    });

    // Create a map of user IDs to their roles
    const roleMap = new Map(
      memberships.map(membership => [
        membership.publicUserData?.userId,
        membership.role
      ])
    );

    // Combine Supabase user data with Clerk roles
    const users = supabaseUsers.map(user => {
      const roleValue = roleMap.get(user.clerk_user_id) || 'org:user';
      return {
        ...user,
        role: roleValue,
        roleLabel: ROLE_LABELS[roleValue] || 'User'
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in users API route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 