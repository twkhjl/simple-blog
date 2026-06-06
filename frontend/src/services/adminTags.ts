import type { AdminTag } from '../types'
import { createApiClient } from './api'
import { extractAccessToken } from './auth'
import { authState } from '../stores/auth'

interface AdminTagsResponse {
  items: AdminTag[]
  total: number
}

function getClient() {
  return createApiClient(fetch, () => extractAccessToken(authState.session))
}

export const adminTagsService = {
  async listTags() {
    const payload = await getClient().get<AdminTagsResponse>('/api/admin/tags')
    return payload.items
  },
  async createTag(name: string) {
    return getClient().post<AdminTag>('/api/admin/tags', { name })
  },
  async updateTag(id: string, name: string) {
    return getClient().put<AdminTag>(`/api/admin/tags/${id}`, { name })
  },
  async updateTagStatus(id: string, status: 'active' | 'disabled') {
    return getClient().patch<AdminTag>(`/api/admin/tags/${id}/status`, { status })
  },
  async deleteTag(id: string) {
    return getClient().delete<{ id: string, deleted: boolean }>(`/api/admin/tags/${id}`)
  },
}
