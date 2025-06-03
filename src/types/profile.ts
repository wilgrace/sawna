export interface Profile {
  id: string; // Clerk User ID
  email: string;
  first_name: string | null;
  last_name: string | null;
  organization_id: string | null;
  is_super_admin: boolean;
  date_of_birth?: string | null;
  gender?: string | null;
  ethnicity?: string | null;
  home_postal_code?: string | null;
  clerk_user_id?: string;
  created_at: string;
  updated_at: string;
} 