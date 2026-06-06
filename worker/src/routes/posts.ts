import { slugifyTagName, publicTagShape, uniqTagInputs } from '../lib/tags'
import { buildFileUrl } from '../lib/r2'
import { createSupabaseAdminClient } from '../lib/supabase'
import type { PostRecord, TagRecord, TagStatus, WorkerBindings } from '../types'

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

interface DbTagRow {
  id: string
  name: string
  slug: string
  status: TagStatus
}

interface DbPostTagLinkRow {
  post_id: string
  tag_id: string
}

interface AdminPostPayload {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageKey: string | null
  status: PostRecord['status']
  publishedAt: string | null
  tags: string[]
}

const mockTags: TagRecord[] = [
  { id: 'tag-launch', name: 'Launch', slug: 'launch', status: 'active' },
  { id: 'tag-vue', name: 'Vue', slug: 'vue', status: 'active' },
  { id: 'tag-release', name: 'Release', slug: 'release', status: 'active' },
  { id: 'tag-legacy', name: 'Legacy', slug: 'legacy', status: 'disabled' },
]

const mockPosts: PostRecord[] = [
  {
    id: 'post-1',
    title: 'Launch Checklist',
    slug: 'launch-checklist',
    excerpt: 'Reference article for published-state testing.',
    content: '# Launch Checklist\n\nUse this sample entry for published article flows.',
    coverImageKey: 'posts/2026/05/sample-cover.webp',
    status: 'published',
    authorId: 'editor-1',
    authorDisplayName: 'Editorial Account',
    publishedAt: '2026-05-16T00:00:00Z',
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-16T00:00:00Z',
    tags: [mockTags[0], mockTags[1]],
  },
  {
    id: 'post-2',
    title: 'Review Queue Note',
    slug: 'review-queue-note',
    excerpt: 'Reference article for draft-state testing.',
    content: '# Review Queue Note\n\nKeep this sample entry in draft state.',
    coverImageKey: null,
    status: 'draft',
    authorId: 'editor-1',
    authorDisplayName: 'Editorial Account',
    publishedAt: null,
    createdAt: '2026-05-14T00:00:00Z',
    updatedAt: '2026-05-17T00:00:00Z',
    tags: [mockTags[1]],
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
    authorDisplayName: 'Unassigned Profile',
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: [],
  }
}

function mapDbTag(row: DbTagRow): TagRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
  }
}

function sanitizePublicTags(tags: TagRecord[]) {
  return tags
    .filter(tag => tag.status === 'active')
    .map(publicTagShape)
}

function toPublicListItem(post: PostRecord, env?: WorkerBindings) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageKey ? buildFileUrl(env, post.coverImageKey) : null,
    publishedAt: post.publishedAt,
    tags: sanitizePublicTags(post.tags),
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
    tags: sanitizePublicTags(post.tags),
  }
}

function toAdminTag(tag: TagRecord, posts: PostRecord[]) {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    status: tag.status,
    postCount: posts.filter(post => post.tags.some(postTag => postTag.id === tag.id)).length,
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
    tags: post.tags.map(publicTagShape),
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

async function loadTagsForPosts(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  posts: PostRecord[],
) {
  if (!adminClient || posts.length === 0) {
    return posts
  }

  const postIds = posts.map(post => post.id)
  const { data, error } = await adminClient
    .from('post_tags')
    .select('post_id, tags(id, name, slug, status)')
    .in('post_id', postIds)

  if (error || !data) {
    return posts
  }

  const tagMap = new Map<string, TagRecord[]>()
  for (const row of data as Array<{ post_id: string, tags: DbTagRow | DbTagRow[] | null }>) {
    const rawTags = Array.isArray(row.tags) ? row.tags : row.tags ? [row.tags] : []
    tagMap.set(row.post_id, rawTags.map(mapDbTag))
  }

  return posts.map(post => ({
    ...post,
    tags: tagMap.get(post.id) ?? [],
  }))
}

function ensureMockTags(tagNames: string[]) {
  const names = uniqTagInputs(tagNames)
  const nextTags: TagRecord[] = []

  for (const name of names) {
    const slug = slugifyTagName(name)
    const existing = mockTags.find(tag => tag.slug === slug)

    if (existing?.status === 'disabled') {
      return { error: `Tag "${name}" is disabled.` }
    }

    if (existing) {
      nextTags.push(existing)
      continue
    }

    const created: TagRecord = {
      id: `tag-${slug}`,
      name,
      slug,
      status: 'active',
    }
    mockTags.push(created)
    nextTags.push(created)
  }

  return { tags: nextTags }
}

async function resolveDbTags(
  adminClient: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  tagNames: string[],
) {
  const names = uniqTagInputs(tagNames)
  if (names.length === 0) {
    return { tags: [] as TagRecord[] }
  }

  const slugs = names.map(slugifyTagName)
  const { data, error } = await adminClient
    .from('tags')
    .select('id, name, slug, status')
    .in('slug', slugs)

  if (error) {
    return { error: 'Failed to resolve tags.' }
  }

  const bySlug = new Map<string, TagRecord>((data as DbTagRow[] | null ?? []).map(row => [row.slug, mapDbTag(row)]))
  const resolved: TagRecord[] = []

  for (const name of names) {
    const slug = slugifyTagName(name)
    const existing = bySlug.get(slug)

    if (existing?.status === 'disabled') {
      return { error: `Tag "${name}" is disabled.` }
    }

    if (existing) {
      resolved.push(existing)
      continue
    }

    const createdRes = await adminClient
      .from('tags')
      .insert({ name, slug, status: 'active' })
      .select('id, name, slug, status')
      .single()

    if (createdRes.error || !createdRes.data) {
      return { error: 'Failed to create tag.' }
    }

    const created = mapDbTag(createdRes.data as DbTagRow)
    bySlug.set(created.slug, created)
    resolved.push(created)
  }

  return { tags: resolved }
}

async function syncPostTags(
  adminClient: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  postId: string,
  tagIds: string[],
) {
  const deleteRes = await adminClient
    .from('post_tags')
    .delete()
    .eq('post_id', postId)

  if (deleteRes.error) {
    return false
  }

  if (tagIds.length === 0) {
    return true
  }

  const insertRes = await adminClient
    .from('post_tags')
    .insert(tagIds.map(tagId => ({ post_id: postId, tag_id: tagId })))

  return !insertRes.error
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
    .select('id, title, slug, excerpt, cover_image_key, content, status, author_id, published_at, created_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error || !data) {
    return mockPosts
      .filter(post => post.status === 'published')
      .map(post => toPublicListItem(post, env))
  }

  const posts = await hydrateAuthorDisplayNames(
    adminClient,
    await loadTagsForPosts(adminClient, (data as unknown as DbPostRow[]).map(mapDbPost)),
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

  const [post] = await hydrateAuthorDisplayNames(
    adminClient,
    await loadTagsForPosts(adminClient, [mapDbPost(data as unknown as DbPostRow)]),
  )
  return toPublicDetail(post, env)
}

export async function listPublicTags(env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const items = mockTags
      .filter(tag => tag.status === 'active')
      .map(tag => ({
        ...publicTagShape(tag),
        postCount: mockPosts.filter(post => post.status === 'published' && post.tags.some(postTag => postTag.id === tag.id)).length,
      }))
      .filter(tag => tag.postCount > 0)

    return items
  }

  const publishedPosts = await listPublishedPosts(env)
  const { data, error } = await adminClient
    .from('tags')
    .select('id, name, slug, status')
    .eq('status', 'active')
    .order('name')

  if (error || !data) {
    return []
  }

  return (data as DbTagRow[])
    .map(mapDbTag)
    .map(tag => ({
      ...publicTagShape(tag),
      postCount: publishedPosts.filter(post => post.tags.some(postTag => postTag.slug === tag.slug)).length,
    }))
    .filter(tag => tag.postCount > 0)
}

export async function getPublicTagPostsBySlug(slug: string, env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const tag = mockTags.find(item => item.slug === slug)
    if (!tag || tag.status !== 'active') {
      return null
    }

    const items = mockPosts
      .filter(post => post.status === 'published' && post.tags.some(postTag => postTag.slug === slug))
      .map(post => toPublicListItem(post, env))

    return {
      tag: publicTagShape(tag),
      items,
      total: items.length,
    }
  }

  const { data, error } = await adminClient
    .from('tags')
    .select('id, name, slug, status')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data || (data as DbTagRow).status !== 'active') {
    return null
  }

  const publishedPosts = await listPublishedPosts(env)
  const items = publishedPosts.filter(post => post.tags.some(postTag => postTag.slug === slug))

  return {
    tag: publicTagShape(mapDbTag(data as DbTagRow)),
    items,
    total: items.length,
  }
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
    await loadTagsForPosts(adminClient, (data as unknown as DbPostRow[]).map(mapDbPost)),
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

  const [post] = await hydrateAuthorDisplayNames(
    adminClient,
    await loadTagsForPosts(adminClient, [mapDbPost(data as unknown as DbPostRow)]),
  )
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
    const tagResult = ensureMockTags(payload.tags)
    if (tagResult.error) {
      return { error: tagResult.error, post: null }
    }

    const post: PostRecord = {
      id: crypto.randomUUID(),
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt,
      content: payload.content,
      coverImageKey: payload.coverImageKey,
      status: payload.status,
      authorId: author.id,
      authorDisplayName: author.displayName ?? 'Unassigned Profile',
      publishedAt,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      tags: tagResult.tags ?? [],
    }

    mockPosts.unshift(post)
    return { error: null, post }
  }

  const tagResult = await resolveDbTags(adminClient, payload.tags)
  if (tagResult.error) {
    return { error: tagResult.error, post: null }
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
    return { error: 'Failed to create post.', post: null }
  }

  const synced = await syncPostTags(adminClient, (data as DbPostRow).id, (tagResult.tags ?? []).map(tag => tag.id))
  if (!synced) {
    return { error: 'Failed to sync post tags.', post: null }
  }

  const [post] = await hydrateAuthorDisplayNames(
    adminClient,
    await loadTagsForPosts(adminClient, [mapDbPost(data as unknown as DbPostRow)]),
  )
  return { error: null, post }
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
      return { error: 'Post not found.', post: null }
    }

    const tagResult = ensureMockTags(payload.tags)
    if (tagResult.error) {
      return { error: tagResult.error, post: null }
    }

    target.title = payload.title
    target.slug = payload.slug
    target.excerpt = payload.excerpt
    target.content = payload.content
    target.coverImageKey = payload.coverImageKey
    target.status = payload.status
    target.publishedAt = publishedAt
    target.updatedAt = nowIso()
    target.tags = tagResult.tags ?? []
    return { error: null, post: target }
  }

  const tagResult = await resolveDbTags(adminClient, payload.tags)
  if (tagResult.error) {
    return { error: tagResult.error, post: null }
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
    return { error: 'Failed to update post.', post: null }
  }

  const synced = await syncPostTags(adminClient, id, (tagResult.tags ?? []).map(tag => tag.id))
  if (!synced) {
    return { error: 'Failed to sync post tags.', post: null }
  }

  const [post] = await hydrateAuthorDisplayNames(
    adminClient,
    await loadTagsForPosts(adminClient, [mapDbPost(data as unknown as DbPostRow)]),
  )
  return { error: null, post }
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

export async function listAdminTags(env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    return mockTags.map(tag => toAdminTag(tag, mockPosts))
  }

  const { data, error } = await adminClient
    .from('tags')
    .select('id, name, slug, status')
    .order('name')

  if (error || !data) {
    return []
  }

  const posts = await Promise.all((await listAdminPosts(env)).map(async item => ({
    ...item,
    tags: item.tags as any,
  })))
  return (data as DbTagRow[]).map(row => ({
    ...mapDbTag(row),
    postCount: posts.filter(post => post.tags.some((tag: TagRecord) => tag.id === row.id)).length,
  }))
}

export async function createAdminTag(env: WorkerBindings | undefined, name: string) {
  const slug = slugifyTagName(name)
  if (!slug) {
    return { error: 'Tag name is required.', tag: null }
  }

  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const existing = mockTags.find(tag => tag.slug === slug)
    if (existing?.status === 'disabled') {
      return { error: `Tag "${name}" is disabled.`, tag: null }
    }
    if (existing) {
      return { error: null, tag: toAdminTag(existing, mockPosts) }
    }

    const tag: TagRecord = {
      id: `tag-${slug}`,
      name: name.trim(),
      slug,
      status: 'active',
    }
    mockTags.push(tag)
    return { error: null, tag: toAdminTag(tag, mockPosts) }
  }

  const { data: existingRows } = await adminClient
    .from('tags')
    .select('id, name, slug, status')
    .eq('slug', slug)

  const existing = (existingRows as DbTagRow[] | null)?.[0]
  if (existing?.status === 'disabled') {
    return { error: `Tag "${name}" is disabled.`, tag: null }
  }
  if (existing) {
    return { error: null, tag: { ...mapDbTag(existing), postCount: 0 } }
  }

  const { data, error } = await adminClient
    .from('tags')
    .insert({ name: name.trim(), slug, status: 'active' })
    .select('id, name, slug, status')
    .single()

  if (error || !data) {
    return { error: 'Failed to create tag.', tag: null }
  }

  return { error: null, tag: { ...mapDbTag(data as DbTagRow), postCount: 0 } }
}

export async function updateAdminTag(env: WorkerBindings | undefined, id: string, name: string) {
  const slug = slugifyTagName(name)
  if (!slug) {
    return { error: 'Tag name is required.', tag: null }
  }

  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const target = mockTags.find(tag => tag.id === id)
    if (!target) {
      return { error: 'Tag not found.', tag: null }
    }

    const conflict = mockTags.find(tag => tag.id !== id && tag.slug === slug)
    if (conflict) {
      return { error: 'Tag slug already exists.', tag: null }
    }

    target.name = name.trim()
    target.slug = slug
    return { error: null, tag: toAdminTag(target, mockPosts) }
  }

  const { data: conflicts } = await adminClient
    .from('tags')
    .select('id')
    .eq('slug', slug)
    .neq('id', id)

  if ((conflicts as Array<{ id: string }> | null)?.length) {
    return { error: 'Tag slug already exists.', tag: null }
  }

  const { data, error } = await adminClient
    .from('tags')
    .update({ name: name.trim(), slug })
    .eq('id', id)
    .select('id, name, slug, status')
    .maybeSingle()

  if (error || !data) {
    return { error: 'Failed to update tag.', tag: null }
  }

  return { error: null, tag: { ...mapDbTag(data as DbTagRow), postCount: 0 } }
}

export async function updateAdminTagStatus(env: WorkerBindings | undefined, id: string, status: TagStatus) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const target = mockTags.find(tag => tag.id === id)
    if (!target) {
      return { error: 'Tag not found.', tag: null }
    }

    target.status = status
    return { error: null, tag: toAdminTag(target, mockPosts) }
  }

  const { data, error } = await adminClient
    .from('tags')
    .update({ status })
    .eq('id', id)
    .select('id, name, slug, status')
    .maybeSingle()

  if (error || !data) {
    return { error: 'Failed to update tag status.', tag: null }
  }

  return { error: null, tag: { ...mapDbTag(data as DbTagRow), postCount: 0 } }
}

export async function deleteAdminTag(env: WorkerBindings | undefined, id: string) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const index = mockTags.findIndex(tag => tag.id === id)
    if (index === -1) {
      return { error: 'Tag not found.', deleted: false }
    }

    mockTags.splice(index, 1)
    for (const post of mockPosts) {
      post.tags = post.tags.filter(tag => tag.id !== id)
    }

    return { error: null, deleted: true }
  }

  const unlinkResult = await adminClient
    .from('post_tags')
    .delete()
    .eq('tag_id', id)

  if (unlinkResult.error) {
    return { error: 'Failed to delete tag links.', deleted: false }
  }

  const deleteResult = await adminClient
    .from('tags')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (deleteResult.error) {
    return { error: 'Failed to delete tag.', deleted: false }
  }

  if (!deleteResult.data) {
    return { error: 'Tag not found.', deleted: false }
  }

  return { error: null, deleted: true }
}
