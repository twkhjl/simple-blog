import { buildFileUrl } from '../lib/r2'
import { createSupabaseAdminClient } from '../lib/supabase'
import type { PostRecord, WorkerBindings } from '../types'

interface DbPostRow {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_key: string | null
  status: PostRecord['status']
  author_id: string
  published_at: string | null
  created_at: string
  updated_at: string
  profiles?: Array<{
    display_name: string | null
  }> | {
    display_name: string | null
  } | null
}

const mockPosts: PostRecord[] = [
  {
    id: 'post-1',
    title: 'First Post',
    slug: 'first-post',
    excerpt: 'This is the first mock post.',
    content: '# First Post\n\nThis is mock content.',
    coverImageKey: 'posts/2026/05/cover.webp',
    status: 'published',
    authorId: 'editor-1',
    authorDisplayName: 'Editor User',
    publishedAt: '2026-05-16T00:00:00Z',
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-16T00:00:00Z',
  },
  {
    id: 'post-2',
    title: 'Draft Post',
    slug: 'draft-post',
    excerpt: 'Draft excerpt',
    content: '# Draft Post\n\nNot published yet.',
    coverImageKey: null,
    status: 'draft',
    authorId: 'editor-1',
    authorDisplayName: 'Editor User',
    publishedAt: null,
    createdAt: '2026-05-14T00:00:00Z',
    updatedAt: '2026-05-17T00:00:00Z',
  },
]

function mapDbPost(row: DbPostRow): PostRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? '',
    content: row.content,
    coverImageKey: row.cover_image_key,
    status: row.status,
    authorId: row.author_id,
    authorDisplayName: Array.isArray(row.profiles)
      ? (row.profiles[0]?.display_name ?? 'Unknown Author')
      : (row.profiles?.display_name ?? 'Unknown Author'),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toPublicListItem(post: PostRecord, env?: WorkerBindings) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageKey ? buildFileUrl(env, post.coverImageKey) : null,
    publishedAt: post.publishedAt,
  }
}

function toPublicDetail(post: PostRecord, env?: WorkerBindings) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageKey ? buildFileUrl(env, post.coverImageKey) : null,
    status: post.status,
    author: {
      id: post.authorId,
      displayName: post.authorDisplayName,
    },
    publishedAt: post.publishedAt,
  }
}

function toAdminListItem(post: PostRecord) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    authorId: post.authorId,
    authorDisplayName: post.authorDisplayName,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  }
}

export async function listPublishedPosts(env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    return mockPosts
      .filter(post => post.status === 'published')
      .map(post => toPublicListItem(post, env))
  }

  const { data, error } = await adminClient
    .from('posts')
    .select('id, title, slug, excerpt, cover_image_key, status, author_id, published_at, created_at, updated_at, profiles:author_id(display_name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error || !data) {
    return mockPosts
      .filter(post => post.status === 'published')
      .map(post => toPublicListItem(post, env))
  }

  return (data as unknown as DbPostRow[]).map(row => toPublicListItem(mapDbPost(row), env))
}

export async function getPublishedPostBySlug(slug: string, env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const post = mockPosts.find(item => item.slug === slug && item.status === 'published')
    return post ? toPublicDetail(post, env) : null
  }

  const { data, error } = await adminClient
    .from('posts')
    .select('id, title, slug, excerpt, content, cover_image_key, status, author_id, published_at, created_at, updated_at, profiles:author_id(display_name)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !data) {
    const post = mockPosts.find(item => item.slug === slug && item.status === 'published')
    return post ? toPublicDetail(post, env) : null
  }

  return toPublicDetail(mapDbPost(data as unknown as DbPostRow), env)
}

export async function listAdminPosts(env: WorkerBindings | undefined, authorId?: string) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const items = authorId ? mockPosts.filter(post => post.authorId === authorId) : mockPosts
    return items.map(toAdminListItem)
  }

  let query = adminClient
    .from('posts')
    .select('id, title, slug, excerpt, content, cover_image_key, status, author_id, published_at, created_at, updated_at, profiles:author_id(display_name)')
    .order('updated_at', { ascending: false })

  if (authorId) {
    query = query.eq('author_id', authorId)
  }

  const { data, error } = await query
  if (error || !data) {
    const items = authorId ? mockPosts.filter(post => post.authorId === authorId) : mockPosts
    return items.map(toAdminListItem)
  }

  return (data as unknown as DbPostRow[]).map(row => toAdminListItem(mapDbPost(row)))
}

export async function getAdminPostById(id: string, env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    return mockPosts.find(post => post.id === id) ?? null
  }

  const { data, error } = await adminClient
    .from('posts')
    .select('id, title, slug, excerpt, content, cover_image_key, status, author_id, published_at, created_at, updated_at, profiles:author_id(display_name)')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    return mockPosts.find(post => post.id === id) ?? null
  }

  return mapDbPost(data as unknown as DbPostRow)
}
