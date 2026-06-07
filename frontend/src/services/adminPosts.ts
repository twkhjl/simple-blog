import type { AdminPostListResponse } from '../types'
import { createApiClient } from './api'
import { extractAccessToken } from './auth'
import { authState } from '../stores/auth'

interface AdminPostsClient {
  get<T>(path: string): Promise<T>
}

function createAuthedClient() {
  return createApiClient(fetch, () => extractAccessToken(authState.session))
}

export function createAdminPostsService(client: AdminPostsClient = createAuthedClient()) {
  return {
    listPosts(options: { page: number, limit: number }) {
      const params = new URLSearchParams({
        page: String(options.page),
        limit: String(options.limit),
      })

      return client.get<AdminPostListResponse>(`/api/admin/posts?${params.toString()}`)
    },
  }
}

export const adminPostsService = createAdminPostsService()
