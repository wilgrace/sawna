"use server"

import { createClient } from "@supabase/supabase-js"
import { clerkClient } from "@clerk/clerk-sdk-node"

async function getClerkUser(clerkUserId: string) {
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
    )

    const { data, error } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle()

    if (error) {
      console.error("Error getting clerk user:", error)
      return {
        success: false,
        error: error.message
      }
    }

    if (!data) {
      return {
        success: true,
        id: undefined
      }
    }

    return {
      success: true,
      id: data.id
    }
  } catch (error) {
    console.error("Error in getClerkUser:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

async function createClerkUser(params: { clerk_user_id?: string; email: string; first_name?: string; last_name?: string; organization_id?: string }) {
  try {
    if (!params.clerk_user_id) {
      return {
        success: false,
        error: "clerk_user_id is required to create a user."
      };
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // First check if the user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", params.clerk_user_id)
      .single()

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 is "no rows returned"
      console.error("Error checking for existing user:", checkError)
      return {
        success: false,
        error: "Failed to check for existing user"
      }
    }

    if (existingUser) {
      // User already exists, return their ID
      return {
        success: true,
        id: existingUser.id
      }
    }

    // Get the organization ID to use
    const orgId = params.organization_id || '11111111-1111-1111-1111-111111111111';
    if (!orgId) {
      console.error("No valid organization_id found for clerk user creation.", { params })
      return {
        success: false,
        error: "No valid organization_id found for clerk user creation."
      }
    }

    console.log("Creating clerk user with:", {
      clerk_user_id: params.clerk_user_id,
      email: params.email,
      first_name: params.first_name,
      last_name: params.last_name,
      organization_id: orgId
    });

    // Create new user
    const { data, error } = await supabase
      .from("clerk_users")
      .insert({
        clerk_user_id: params.clerk_user_id,
        email: params.email,
        first_name: params.first_name,
        last_name: params.last_name,
        organization_id: orgId
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating clerk user:", error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      id: data.id
    }
  } catch (error) {
    console.error("Error in createClerkUser:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

async function ensureClerkUser(clerkUserId: string, email: string, firstName: string | null, lastName: string | null) {
  try {
    console.log("Ensuring clerk user exists:", {
      clerkUserId,
      email,
      firstName,
      lastName
    })

    if (!email) {
      console.error("Email is required for clerk user")
      return {
        success: false,
        error: "Email is required for clerk user"
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // First try to get the user
    const { data: existingUser, error: getError } = await supabase
      .from("clerk_users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle()

    if (getError) {
      console.error("Error getting clerk user:", getError)
      return {
        success: false,
        error: getError.message
      }
    }

    // If user exists, return their ID
    if (existingUser) {
      console.log("Found existing clerk user:", existingUser)
      return {
        success: true,
        id: existingUser.id
      }
    }

    console.log("Creating new clerk user...")

    // If user doesn't exist, create them
    // Use the hardcoded organization ID
    const orgId = '11111111-1111-1111-1111-111111111111';

    const { data: newUser, error: createError } = await supabase
      .from("clerk_users")
      .insert({
        clerk_user_id: clerkUserId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        organization_id: orgId
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating clerk user:", createError)
      return {
        success: false,
        error: createError.message
      }
    }

    console.log("Successfully created new clerk user:", newUser)

    return {
      success: true,
      id: newUser.id
    }
  } catch (error) {
    console.error("Error in ensureClerkUser:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

async function listClerkUsers() {
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
    )

    const { data, error } = await supabase
      .from("clerk_users")
      .select("*")

    if (error) {
      console.error("Error listing clerk users:", error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      users: data
    }
  } catch (error) {
    console.error("Error in listClerkUsers:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

async function updateClerkUser(id: string, data: any) {
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
    )

    const { error } = await supabase
      .from("clerk_users")
      .update(data)
      .eq("id", id)

    if (error) {
      console.error("Error updating clerk user:", error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error("Error in updateClerkUser:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

async function deleteClerkUser(id: string) {
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
    )

    const { error } = await supabase
      .from("clerk_users")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting clerk user:", error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error("Error in deleteClerkUser:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

async function syncOrganizationToClerk(organizationId: string) {
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
    )

    // Get organization details from Supabase
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single()

    if (orgError) {
      console.error("Error getting organization:", orgError)
      return {
        success: false,
        error: orgError.message
      }
    }

    if (!org) {
      return {
        success: false,
        error: "Organization not found"
      }
    }

    // Get all users in the organization
    const { data: users, error: usersError } = await supabase
      .from("clerk_users")
      .select("clerk_user_id")
      .eq("organization_id", organizationId)

    if (usersError) {
      console.error("Error getting organization users:", usersError)
      return {
        success: false,
        error: usersError.message
      }
    }

    // Create or update organization in Clerk
    try {
      const clerkOrg = await clerkClient.organizations.createOrganization({
        name: org.name,
        createdBy: users[0]?.clerk_user_id // Use the first user as the creator
      })

      // Add all users to the organization
      for (const user of users) {
        await clerkClient.organizations.createOrganizationMembership({
          organizationId: clerkOrg.id,
          userId: user.clerk_user_id,
          role: "basic_member"
        })
      }

      return {
        success: true,
        organizationId: clerkOrg.id
      }
    } catch (clerkError) {
      console.error("Error syncing with Clerk:", clerkError)
      return {
        success: false,
        error: clerkError instanceof Error ? clerkError.message : "Unknown error occurred"
      }
    }
  } catch (error) {
    console.error("Error in syncOrganizationToClerk:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

async function handleOrganizationChange(organizationId: string) {
  try {
    const result = await syncOrganizationToClerk(organizationId)
    if (!result.success) {
      console.error("Failed to sync organization to Clerk:", result.error)
    }
  } catch (error) {
    console.error("Error in handleOrganizationChange:", error)
  }
}

export {
  getClerkUser,
  createClerkUser,
  ensureClerkUser,
  listClerkUsers,
  updateClerkUser,
  deleteClerkUser,
  syncOrganizationToClerk,
  handleOrganizationChange
} 