export const ROLES = {
  ADMIN: "admin",
  INTERVIEWER: "interviewer",
};

export const PERMISSIONS = {
  UPDATE_COMPANY: "update_company",
  MANAGE_TEAM: "manage_team",
};

const rolePermissions: Record<string, string[]> = {
  [ROLES.ADMIN]: [PERMISSIONS.MANAGE_TEAM],
  [ROLES.INTERVIEWER]: [],
};

export function isCompanyOwner(
  userId: string | undefined,
  companyCreatedBy: string | undefined
): boolean {
  return !!userId && !!companyCreatedBy && userId === companyCreatedBy;
}

export function canUpdateCompany(user: { id?: string; company?: { created_by?: string } } | null | undefined): boolean {
  return isCompanyOwner(user?.id, user?.company?.created_by);
}

export function normalizeRole(role: string | undefined): string | undefined {
  if (!role) return undefined;
  const normalized = role.trim().toLowerCase();
  if (normalized === ROLES.ADMIN || normalized === ROLES.INTERVIEWER) {
    return normalized;
  }
  return role;
}

export function hasPermission(role: string | undefined, permission: string): boolean {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;
  return rolePermissions[normalizedRole]?.includes(permission) || false;
}

export function canManageTeam(role: string | undefined): boolean {
  return hasPermission(role, PERMISSIONS.MANAGE_TEAM);
}
