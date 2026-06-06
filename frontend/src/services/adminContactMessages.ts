import type { AdminContactMessageDetail, AdminContactMessageListItem, ContactMessageStatus } from '../types'
import { createApiClient } from './api'
import { extractAccessToken } from './auth'
import { authState } from '../stores/auth'

interface AdminContactMessagesResponse {
  items: AdminContactMessageListItem[]
  total: number
}

function getClient() {
  return createApiClient(fetch, () => extractAccessToken(authState.session))
}

function buildQuery(params: { status?: ContactMessageStatus | 'all', search?: string }) {
  const searchParams = new URLSearchParams()
  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status)
  }
  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim())
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const adminContactMessagesService = {
  async listMessages(params: { status?: ContactMessageStatus | 'all', search?: string } = {}) {
    const payload = await getClient().get<AdminContactMessagesResponse>(`/api/admin/contact-messages${buildQuery(params)}`)
    return payload.items
  },
  getMessage(id: string) {
    return getClient().get<AdminContactMessageDetail>(`/api/admin/contact-messages/${id}`)
  },
  updateStatus(id: string, status: ContactMessageStatus) {
    return getClient().patch<AdminContactMessageDetail>(`/api/admin/contact-messages/${id}/status`, { status })
  },
}
