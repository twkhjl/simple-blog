import type { LoginRecordsResponse } from '../types'
import { createApiClient } from './api'
import { extractAccessToken } from './auth'
import { authState } from '../stores/auth'

function createAuthedClient() {
  return createApiClient(fetch, () => extractAccessToken(authState.session))
}

export async function listMyLoginRecords(options: { page: number, result: 'all' | 'success' | 'failure' }) {
  const params = new URLSearchParams({
    page: String(options.page),
  })

  if (options.result !== 'all') {
    params.set('result', options.result)
  }

  return createAuthedClient().get<LoginRecordsResponse>(`/api/me/login-records?${params.toString()}`)
}

export async function listAdminLoginRecords(options: { page: number, result: 'all' | 'success' | 'failure', identifier: string }) {
  const params = new URLSearchParams({
    page: String(options.page),
  })

  if (options.result !== 'all') {
    params.set('result', options.result)
  }

  if (options.identifier.trim()) {
    params.set('identifier', options.identifier.trim())
  }

  return createAuthedClient().get<LoginRecordsResponse>(`/api/admin/login-records?${params.toString()}`)
}

export async function listAdminUserLoginRecords(options: {
  page: number
  surface: 'front' | 'admin'
  result: 'all' | 'success' | 'failure'
  identifier: string
}) {
  const params = new URLSearchParams({
    page: String(options.page),
    surface: options.surface,
  })

  if (options.result !== 'all') {
    params.set('result', options.result)
  }

  if (options.identifier.trim()) {
    params.set('identifier', options.identifier.trim())
  }

  return createAuthedClient().get<LoginRecordsResponse>(`/api/admin/user-login-records?${params.toString()}`)
}
