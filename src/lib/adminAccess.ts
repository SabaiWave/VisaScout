export function isAdminUser(userId: string): boolean {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) return false;
  return userId === adminUserId;
}
