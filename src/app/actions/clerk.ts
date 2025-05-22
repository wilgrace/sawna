"use server"

import { createClient } from "@supabase/supabase-js"

interface CreateClerkUserParams {
  clerk_user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  organization_id?: string | null
}

interface CreateClerkUserResult {
  success: boolean
  id?: string
  error?: string
}

interface GetClerkUserResult {
  success: boolean
  id?: string
  error?: string
}

export async function getClerkUser(clerkUserId: string): Promise<GetClerkUserResult> {
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

export async function createClerkUser(params: CreateClerkUserParams): Promise<CreateClerkUserResult> {
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

    // Get the default organization ID
    const { data: defaultOrg, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("name", "Default Organization")
      .single()

    if (orgError || !defaultOrg?.id) {
      console.error("Error getting default organization:", orgError)
      return {
        success: false,
        error: "Failed to get default organization"
      }
    }

    const orgId = params.organization_id || defaultOrg.id;
    if (!orgId) {
      console.error("No valid organization_id found for clerk user creation.", { params, defaultOrg })
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

export async function ensureClerkUser(clerkUserId: string, email: string, firstName: string | null, lastName: string | null): Promise<GetClerkUserResult> {
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
    // Get the default organization ID
    const { data: defaultOrg, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("name", "Default Organization")
      .single();

    if (orgError || !defaultOrg?.id) {
      console.error("Error getting default organization:", orgError);
      return {
        success: false,
        error: "Failed to get default organization"
      };
    }

    const orgId = defaultOrg.id;

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