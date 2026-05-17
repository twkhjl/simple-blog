export function extractAccessToken(session: { access_token?: string } | null) {
  return session?.access_token ?? null
}

export function hasAdminAccess(role?: string | null) {
  return role === 'editor' || role === 'admin' || role === 'super_admin'
}
