/**
 * RBAC permission check helper.
 *
 * Permission values are placeholder strings in the form `resource:action`
 * (e.g. "asset:read"). No special logic is attached to any specific value —
 * this is intentionally a simple string comparison (see Wave 1 rule: ห้าม
 * กำหนดค่า RBAC permission จริง).
 */
export function hasPermission(perms: string[], required: string): boolean {
  return perms.includes(required);
}
