export function isAdminEmail(userEmail: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return userEmail === adminEmail;
}
