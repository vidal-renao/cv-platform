import type { UserPayload } from './auth';

export const INTERNAL_ROLES: UserPayload['role'][] = ['SUPERADMIN', 'ADMIN', 'STAFF'];
export const ADMIN_ROLES: UserPayload['role'][] = ['SUPERADMIN', 'ADMIN'];
export const ALL_ROLES: UserPayload['role'][] = ['SUPERADMIN', 'ADMIN', 'STAFF', 'CLIENT'];
export const NON_SUPERADMIN_ROLES: UserPayload['role'][] = ['ADMIN', 'STAFF', 'CLIENT'];

export function isInternalUser(user: UserPayload | null): user is UserPayload {
  return Boolean(user && INTERNAL_ROLES.includes(user.role));
}

export function isAdminUser(user: UserPayload | null): user is UserPayload {
  return Boolean(user && ADMIN_ROLES.includes(user.role));
}

export function assignableRolesFor(user: UserPayload): UserPayload['role'][] {
  return user.role === 'SUPERADMIN' ? ALL_ROLES : NON_SUPERADMIN_ROLES;
}

export function canAccessTenantResource(user: UserPayload, ownerId: string): boolean {
  if (user.role === 'SUPERADMIN') {
    return true;
  }
  return user.id === ownerId;
}
