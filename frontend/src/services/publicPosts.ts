import type { PublicPostDetail, PublicPostListItem } from '../types'
import { ApiRequestError, createApiClient } from './api'

interface PublicPostListResponse {
  items: PublicPostListItem[]
  page: number
  limit: number
  total: number
}

interface PublicPostsClient {
  get<T>(path: string): Promise<T>
}

export function createPublicPostsService(client: PublicPostsClient = createApiClient()) {
  return {
    async listPosts(): Promise<PublicPostListItem[]> {
      const payload = await client.get<PublicPostListResponse>('/api/posts')
      return payload.items
    },
    async getPostBySlug(slug: string): Promise<PublicPostDetail | null> {
      try {
        return await client.get<PublicPostDetail>(`/api/posts/${slug}`)
      }
      catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) {
          return null
        }

        throw error
      }
    },
  }
}

export const publicPostsService = createPublicPostsService()
