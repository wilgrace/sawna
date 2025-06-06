import { useUser } from "@clerk/nextjs";

export type UserRole = 'org:super_admin' | 'org:admin' | 'org:user';

export const ROLES = {
  SUPER_ADMIN: 'org:super_admin',
  ADMIN: 'org:admin',
  USER: 'org:user'
} as const;

export function useUserRole(): UserRole | null {
  const { user } = useUser();
  const membership = user?.organizationMemberships?.[0];
  return membership?.role as UserRole || null;
}

export function useHasRole(requiredRole: UserRole | UserRole[]): boolean {
  const userRole = useUserRole();
  if (!userRole) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
}

export function useIsAdmin(): boolean {
  return useHasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
}

export function useIsSuperAdmin(): boolean {
  return useHasRole(ROLES.SUPER_ADMIN);
}

export async function requireRole(requiredRole: UserRole | UserRole[]): Promise<void> {
  const hasRequiredRole = await useHasRole(requiredRole);
  if (!hasRequiredRole) {
    throw new Error('Unauthorized: Insufficient permissions');
  }
}

export async function requireAdmin(): Promise<void> {
  await requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
}

export async function requireSuperAdmin(): Promise<void> {
  await requireRole(ROLES.SUPER_ADMIN);
} 