import type { PublicCommentNode, PublicCommentSubmission } from '../types'
import { createApiClient } from './api'

interface PublicCommentsResponse {
  items: PublicCommentNode[]
  total: number
}

const client = createApiClient(fetch)

export const publicCommentsService = {
  async listComments(slug: string) {
    const payload = await client.get<PublicCommentsResponse>(`/api/posts/${slug}/comments`)
    return payload.items
  },
  submitComment(slug: string, payload: PublicCommentSubmission) {
    return client.post<{ id: string, success: true }>(`/api/posts/${slug}/comments`, payload)
  },
}
