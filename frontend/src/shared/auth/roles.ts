export type AppRole = "OWNER" | "MEMBER";

export function normalizeRole(role: string | null | undefined): AppRole | null {
  const normalized = role?.trim().toUpperCase();
  if (normalized === "OWNER" || normalized === "MEMBER") {
    return normalized;
  }
  return null;
}

export function isOwnerRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "OWNER";
}
