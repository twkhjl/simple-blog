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
}

interface AdminPostPayload {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageKey: string | null
  status: PostRecord['status']
  publishedAt: string | null
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

function nowIso() {
  return new Date().toISOString()
}

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
    authorDisplayName: 'Unknown Author',
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function hydrateAuthorDisplayNames(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  posts: PostRecord[],
) {
  if (!adminClient || posts.length === 0) {
    return posts
  }

  const authorIds = [...new Set(posts.map(post => post.authorId))]
  const { data, error } = await adminClient
    .from('profiles')
    .select('id, display_name')
    .in('id', authorIds)

  if (error || !data) {
    return posts
  }

  const nameMap = new Map<string, string | null>(
    data.map(row => [row.id as string, (row.display_name as string | null) ?? null]),
  )

  return posts.map(post => ({
    ...post,
    authorDisplayName: nameMap.get(post.authorId) ?? post.authorDisplayName,
  }))
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
    .select('id, title, slug, excerpt, cover_image_key, status, author_id, published_at, created_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error || !data) {
    return mockPosts
      .filter(post => post.status === 'published')
      .map(post => toPublicListItem(post, env))
  }

  const posts = await hydrateAuthorDisplayNames(
    adminClient,
    (data as unknown as DbPostRow[]).map(mapDbPost),
  )

  return posts.map(post => toPublicListItem(post, env))
}

export async function getPublishedPostBySlug(slug: string, env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const post = mockPosts.find(item => item.slug === slug && item.status === 'published')
    return post ? toPublicDetail(post, env) : null
  }

  const { data, error } = await adminClient
    .from('posts')
    .select('id, title, slug, excerpt, content, cover_image_key, status, author_id, published_at, created_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !data) {
    const post = mockPosts.find(item => item.slug === slug && item.status === 'published')
    return post ? toPublicDetail(post, env) : null
  }

  const [post] = await hydrateAuthorDisplayNames(adminClient, [mapDbPost(data as unknown as DbPostRow)])
  return toPublicDetail(post, env)
}

export async function listAdminPosts(env: WorkerBindings | undefined, authorId?: string) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const items = authorId ? mockPosts.filter(post => post.authorId === authorId) : mockPosts
    return items.map(toAdminListItem)
  }

  let query = adminClient
    .from('posts')
    .select('id, title, slug, excerpt, content, cover_image_key, status, author_id, published_at, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (authorId) {
    query = query.eq('author_id', authorId)
  }

  const { data, error } = await query
  if (error || !data) {
    const items = authorId ? mockPosts.filter(post => post.authorId === authorId) : mockPosts
    return items.map(toAdminListItem)
  }

  const posts = await hydrateAuthorDisplayNames(
    adminClient,
    (data as unknown as DbPostRow[]).map(mapDbPost),
  )

  return posts.map(toAdminListItem)
}

export async function getAdminPostById(id: string, env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    return mockPosts.find(post => post.id === id) ?? null
  }

  const { data, error } = await adminClient
    .from('posts')
    .select('id, title, slug, excerpt, content, cover_image_key, status, author_id, published_at, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    return mockPosts.find(post => post.id === id) ?? null
  }

  const [post] = await hydrateAuthorDisplayNames(adminClient, [mapDbPost(data as unknown as DbPostRow)])
  return post
}

export async function createAdminPost(
  env: WorkerBindings | undefined,
  author: { id: string, displayName: string | null },
  payload: AdminPostPayload,
) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  const publishedAt = payload.status === 'published'
    ? (payload.publishedAt ?? nowIso())
    : payload.status === 'archived'
      ? (payload.publishedAt ?? nowIso())
      : null

  if (!adminClient) {
    const post: PostRecord = {
      id: crypto.randomUUID(),
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt,
      content: payload.content,
      coverImageKey: payload.coverImageKey,
      status: payload.status,
      authorId: author.id,
      authorDisplayName: author.displayName ?? 'Unknown Author',
      publishedAt,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    mockPosts.unshift(post)
    return post
  }

  const { data, error } = await adminClient
    .from('posts')
    .insert({
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt,
      content: payload.content,
      cover_image_key: payload.coverImageKey,
      status: payload.status,
      author_id: author.id,
      published_at: publishedAt,
    })
    .select('id, title, slug, excerpt, content, cover_image_key, status, author_id, published_at, created_at, updated_at')
    .single()

  if (error || !data) {
    return null
  }

  const [post] = await hydrateAuthorDisplayNames(adminClient, [mapDbPost(data as unknown as DbPostRow)])
  return post
}

export async function updateAdminPost(
  env: WorkerBindings | undefined,
  id: string,
  payload: AdminPostPayload,
) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  const publishedAt = payload.status === 'published'
    ? (payload.publishedAt ?? nowIso())
    : payload.status === 'archived'
      ? (payload.publishedAt ?? nowIso())
      : null

  if (!adminClient) {
    const target = mockPosts.find(post => post.id === id)
    if (!target) {
      return null
    }

    target.title = payload.title
    target.slug = payload.slug
    target.excerpt = payload.excerpt
    target.content = payload.content
    target.coverImageKey = payload.coverImageKey
    target.status = payload.status
    target.publishedAt = publishedAt
    target.updatedAt = nowIso()
    return target
  }

  const { data, error } = await adminClient
    .from('posts')
    .update({
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt,
      content: payload.content,
      cover_image_key: payload.coverImageKey,
      status: payload.status,
      published_at: publishedAt,
    })
    .eq('id', id)
    .select('id, title, slug, excerpt, content, cover_image_key, status, author_id, published_at, created_at, updated_at')
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const [post] = await hydrateAuthorDisplayNames(adminClient, [mapDbPost(data as unknown as DbPostRow)])
  return post
}

export async function deleteAdminPost(env: WorkerBindings | undefined, id: string) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const index = mockPosts.findIndex(post => post.id === id)
    if (index === -1) {
      return false
    }

    mockPosts.splice(index, 1)
    return true
  }

  const { error } = await adminClient.from('posts').delete().eq('id', id)
  return !error
}
