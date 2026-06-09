import type { AdminCommentDetail, AdminCommentListItem, CommentStatus } from '../types'
import { createApiClient } from './api'
import { extractAccessToken } from './auth'
import { authState } from '../stores/auth'

interface AdminCommentsResponse {
  items: AdminCommentListItem[]
  total: number
}

function getClient() {
  return createApiClient(fetch, () => extractAccessToken(authState.session))
}

function buildQuery(params: { status?: CommentStatus | 'all', search?: string, postId?: string }) {
  const searchParams = new URLSearchParams()
  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status)
  }
  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim())
  }
  if (params.postId?.trim()) {
    searchParams.set('postId', params.postId.trim())
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const adminCommentsService = {
  async listComments(params: { status?: CommentStatus | 'all', search?: string, postId?: string } = {}) {
    const payload = await getClient().get<AdminCommentsResponse>(`/api/admin/comments${buildQuery(params)}`)
    return payload.items
  },
  getComment(id: string) {
    return getClient().get<AdminCommentDetail>(`/api/admin/comments/${id}`)
  },
  updateStatus(id: string, status: CommentStatus) {
    return getClient().patch<AdminCommentDetail>(`/api/admin/comments/${id}/status`, { status })
  },
  deleteComment(id: string) {
    return getClient().delete<{ id: string, deleted: true }>(`/api/admin/comments/${id}`)
  },
}
