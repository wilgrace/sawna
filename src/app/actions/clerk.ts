"use server"

import { createClient } from "@supabase/supabase-js"

interface CreateClerkUserParams {
  clerk_user_id: string
  email: string
  first_name: string | null
  last_name: string | null
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

    const { data, error } = await supabase
      .from("clerk_users")
      .insert({
        clerk_user_id: params.clerk_user_id,
        email: params.email,
        first_name: params.first_name,
        last_name: params.last_name
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating clerk user:", error)
      return {
        success: false,
        error: error.message
      }
    }

    if (!data) {
      return {
        success: false,
        error: "No data returned from insert"
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
    const { data: newUser, error: createError } = await supabase
      .from("clerk_users")
      .insert({
        clerk_user_id: clerkUserId,
        email: email,
        first_name: firstName,
        last_name: lastName
      })
      .select("id")
      .single()

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