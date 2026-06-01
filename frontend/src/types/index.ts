export interface ApiEnvelope<T> {
  success: boolean
  data: T
}

export interface ApiErrorEnvelope {
  success: false
  error: {
    code: string
    message: string
  }
}

export interface CurrentUser {
  id: string
  email: string
  username: string | null
  displayName: string | null
  role: 'user' | 'editor' | 'admin' | 'super_admin'
  status: 'active' | 'disabled'
}

export interface SessionUser {
  id: string
  email?: string
}

export interface PublicPostListItem {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string | null
  publishedAt: string | null
}

export interface PublicPostDetail {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  coverImageUrl: string | null
  status: 'published'
  author: {
    id: string
    displayName: string | null
  }
  publishedAt: string | null
}

export interface AdminPostListItem {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  authorId: string
  authorDisplayName: string | null
  publishedAt: string | null
  updatedAt: string
}

export interface AdminPostDetail {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageKey: string | null
  coverImageUrl: string | null
  status: 'draft' | 'published' | 'archived'
  authorId: string
  authorDisplayName: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UploadedFilePayload {
  key: string
  url: string
  fileName: string
  mimeType: string
  size: number
}

export interface LoginRecordUser {
  id: string
  email: string
  username: string | null
  displayName: string | null
}

export interface LoginRecordItem {
  id: string
  surface: 'front' | 'admin'
  result: 'success' | 'failure'
  identifier: string
  ipAddress: string | null
  userAgent: string | null
  failureReason: string | null
  createdAt: string
  user: LoginRecordUser
}

export interface LoginRecordsResponse {
  items: LoginRecordItem[]
  page: number
  limit: number
  total: number
}
