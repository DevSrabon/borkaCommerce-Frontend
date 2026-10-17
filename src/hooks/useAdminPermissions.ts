'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';

/**
 * Admin Role Hierarchy (highest to lowest):
 *   SUPER_ADMIN  – full access, can manage other admins
 *   ADMIN        – full CRUD on all content modules
 *   EDITOR       – create & update only (no delete, no settings, no logs)
 *   VIEWER       – read-only access
 *
 * A user qualifies as SUPER_ADMIN if their email is in SUPER_ADMIN_EMAILS
 * or their role field is 'SUPER_ADMIN'. A regular ADMIN role maps to ADMIN.
 * EDITOR / VIEWER are managed only by role field.
 */

export const SUPER_ADMIN_EMAILS = ['srabon@example.com'];

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'NONE';

const ROLE_RANK: Record<AdminRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
  NONE: 0,
};

function resolveRole(userRole?: string, email?: string): AdminRole {
  if (!userRole && !email) return 'NONE';
  const emailLower = (email || '').toLowerCase();

  if (SUPER_ADMIN_EMAILS.includes(emailLower) || userRole === 'SUPER_ADMIN') {
    return 'SUPER_ADMIN';
  }
  if (userRole === 'ADMIN') return 'ADMIN';
  if (userRole === 'EDITOR') return 'EDITOR';
  if (userRole === 'VIEWER') return 'VIEWER';

  // Legacy fallback: treat any role stored as 'ADMIN' variant
  if (userRole?.toUpperCase().includes('ADMIN')) return 'ADMIN';

  return 'NONE';
}

function hasRank(role: AdminRole, minRole: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

export interface AdminPermissions {
  /** Resolved role string */
  role: AdminRole;

  /** Can view / read any admin data */
  canView: boolean;

  /** Can create new records */
  canCreate: boolean;

  /** Can update / edit existing records */
  canUpdate: boolean;

  /** Can delete records */
  canDelete: boolean;

  /** Can access site-wide settings page */
  canManageSettings: boolean;

  /** Can manage other admin accounts */
  canManageAdmins: boolean;

  /** Can view system logs */
  canViewLogs: boolean;

  /** Can publish / unpublish blog posts or pages */
  canPublish: boolean;

  /** Shorthand: is at least EDITOR */
  isEditor: boolean;

  /** Shorthand: is at least ADMIN */
  isAdmin: boolean;

  /** Shorthand: is SUPER_ADMIN */
  isSuperAdmin: boolean;
}

/**
 * useAdminPermissions()
 *
 * Returns a permissions object derived from the logged-in user role.
 * Use the permission flags to conditionally render edit/delete buttons,
 * protect form submits, and guard route access.
 *
 * @example
 * const { canUpdate, canDelete } = useAdminPermissions();
 * {canDelete && <button onClick={handleDelete}>Delete</button>}
 */
export function useAdminPermissions(): AdminPermissions {
  const user = useSelector((state: RootState) => state.auth.user);

  const role = resolveRole(user?.role, user?.email);

  return {
    role,

    canView: hasRank(role, 'VIEWER'),
    canCreate: hasRank(role, 'EDITOR'),
    canUpdate: hasRank(role, 'EDITOR'),
    canDelete: hasRank(role, 'ADMIN'),
    canManageSettings: hasRank(role, 'ADMIN'),
    canManageAdmins: hasRank(role, 'SUPER_ADMIN'),
    canViewLogs: hasRank(role, 'ADMIN'),
    canPublish: hasRank(role, 'EDITOR'),

    isEditor: hasRank(role, 'EDITOR'),
    isAdmin: hasRank(role, 'ADMIN'),
    isSuperAdmin: role === 'SUPER_ADMIN',
  };
}
