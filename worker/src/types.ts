export type UserRole = 'user' | 'editor' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'disabled'
export type PostStatus = 'draft' | 'published' | 'archived'
export type TagStatus = 'active' | 'disabled'
export type ContactMessageStatus = 'pending' | 'processed'

export interface AuthUser {
  id: string
  email: string
  username: string | null
  displayName: string | null
  role: UserRole
  status: UserStatus
}

export interface WorkerBindings {
  PUBLIC_APP_ORIGIN?: string
  PUBLIC_APP_BASE_PATH?: string
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  R2_PUBLIC_BASE_URL?: string
  FILES_BUCKET?: R2Bucket
}

export interface WorkerVariables {
  user: AuthUser
}

export interface AppEnv {
  Bindings: WorkerBindings
  Variables: WorkerVariables
}

export interface PostRecord {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageKey: string | null
  status: PostStatus
  authorId: string
  authorDisplayName: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  tags: TagRecord[]
}

export interface TagRecord {
  id: string
  name: string
  slug: string
  status: TagStatus
  postCount?: number
}

export interface ContactMessageRecord {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: ContactMessageStatus
  requestIp: string | null
  userAgent: string | null
  createdAt: string
  updatedAt: string
  processedAt: string | null
}

