export function extractAccessToken(session: { access_token?: string } | null) {
  return session?.access_token ?? null
}
