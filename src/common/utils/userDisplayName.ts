/** Build display name from structured fields, with legacy `full_name` fallback. */
export function displayNameFromUser(user: {
  first_name?: string;
  last_name?: string;
  full_name?: string;
} | null | undefined): string {
  const { firstName, lastName } = initialNameFieldsFromUser(user);
  const joined = [firstName, lastName].filter(Boolean).join(" ").trim();
  return joined || (user?.full_name ?? "").trim();
}

/** Form initial values: prefer API first/last; otherwise split legacy `full_name`. */
export function initialNameFieldsFromUser(user: {
  first_name?: string;
  last_name?: string;
  full_name?: string;
} | null | undefined): { firstName: string; lastName: string } {
  const f = user?.first_name?.trim() ?? "";
  const l = user?.last_name?.trim() ?? "";
  if (f || l) return { firstName: f, lastName: l };
  const full = (user?.full_name ?? "").trim();
  if (!full) return { firstName: "", lastName: "" };
  const parts = full.split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export function displayRoleLabel(role: string | undefined): string {
  if (!role) return "";
  if (role === "admin") return "Admin";
  if (role === "interviewer") return "Interviewer";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function initialsFromDisplayName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}
