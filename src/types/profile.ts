export interface Profile {
  id: string; // Clerk User ID
  email: string;
  first_name: string | null;
  last_name: string | null;
  organization_id: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
} 