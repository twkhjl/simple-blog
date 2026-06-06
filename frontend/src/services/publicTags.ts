import type { PublicTagListItem, PublicTagPostsResponse } from '../types'
import { createApiClient } from './api'

interface PublicTagsListResponse {
  items: PublicTagListItem[]
  total: number
}

interface PublicTagsClient {
  get<T>(path: string): Promise<T>
}

export function createPublicTagsService(client: PublicTagsClient = createApiClient()) {
  return {
    async listTags(): Promise<PublicTagListItem[]> {
      const payload = await client.get<PublicTagsListResponse>('/api/tags')
      return payload.items
    },
    async getTagPosts(slug: string): Promise<PublicTagPostsResponse> {
      return client.get<PublicTagPostsResponse>(`/api/tags/${slug}`)
    },
  }
}

export const publicTagsService = createPublicTagsService()
