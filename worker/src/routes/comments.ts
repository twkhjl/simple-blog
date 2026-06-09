import { createSupabaseAdminClient } from '../lib/supabase'
import { getAdminPostById, getPublishedPostBySlug } from './posts'
import type { CommentRecord, CommentStatus, WorkerBindings } from '../types'

interface DbCommentRow {
  id: string
  post_id: string
  parent_id: string | null
  author_name: string
  author_email: string
  body: string
  status: CommentStatus
  request_ip: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
  approved_at: string | null
}

interface CommentSubmissionPayload {
  authorName: string
  authorEmail: string
  body: string
  parentId?: string | null
}

interface CommentSubmissionMeta {
  requestIp: string | null
  userAgent: string | null
}

interface CommentListFilters {
  status?: CommentStatus | 'all'
  postId?: string
  search?: string
}

const COMMENT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const COMMENT_RATE_LIMIT_COUNT = 3
let mockNowTick = Date.now()

const mockComments: CommentRecord[] = []

function nowIso() {
  mockNowTick += 1
  return new Date(mockNowTick).toISOString()
}

function mapDbComment(row: DbCommentRow): CommentRecord {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    body: row.body,
    status: row.status,
    requestIp: row.request_ip,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
  }
}

function normalizeCommentSubmission(payload: Partial<CommentSubmissionPayload> | null) {
  return {
    authorName: typeof payload?.authorName === 'string' ? payload.authorName.trim() : '',
    authorEmail: typeof payload?.authorEmail === 'string' ? payload.authorEmail.trim() : '',
    body: typeof payload?.body === 'string' ? payload.body.trim() : '',
    parentId: typeof payload?.parentId === 'string' && payload.parentId.trim() ? payload.parentId.trim() : null,
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function buildCommentTree(records: CommentRecord[]) {
  interface PublicCommentNode {
    id: string
    parentId: string | null
    authorName: string
    body: string
    createdAt: string
    replies: PublicCommentNode[]
  }

  const byId = new Map(records.map(record => [record.id, { ...record, replies: [] as Array<any> }]))
  const roots: Array<(CommentRecord & { replies: Array<any> })> = []

  for (const record of records) {
    const node = byId.get(record.id)
    if (!node) {
      continue
    }

    if (record.parentId) {
      const parent = byId.get(record.parentId)
      if (parent) {
        parent.replies.push(node)
        continue
      }
    }

    roots.push(node)
  }

  const sortReplies = (nodes: Array<{ createdAt: string, replies: Array<any> }>) => {
    nodes.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    for (const node of nodes) {
      sortReplies(node.replies)
    }
  }

  roots.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  for (const root of roots) {
    sortReplies(root.replies)
  }

  const toPublicNode = (node: CommentRecord & { replies: Array<any> }): PublicCommentNode => ({
    id: node.id,
    parentId: node.parentId,
    authorName: node.authorName,
    body: node.body,
    createdAt: node.createdAt,
    replies: node.replies.map(toPublicNode),
  })

  return roots.map(toPublicNode)
}

function toAdminListItem(comment: CommentRecord, postTitle: string | null, parent: CommentRecord | null) {
  return {
    id: comment.id,
    postId: comment.postId,
    postTitle,
    parentId: comment.parentId,
    parentBody: parent?.body ?? null,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    bodyPreview: comment.body.length > 80 ? `${comment.body.slice(0, 77)}...` : comment.body,
    status: comment.status,
    createdAt: comment.createdAt,
    approvedAt: comment.approvedAt,
  }
}

function toAdminDetail(comment: CommentRecord, postTitle: string | null, parent: CommentRecord | null) {
  return {
    id: comment.id,
    postId: comment.postId,
    postTitle,
    parent: parent
      ? {
          id: parent.id,
          authorName: parent.authorName,
          body: parent.body,
        }
      : null,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    body: comment.body,
    status: comment.status,
    requestIp: comment.requestIp,
    userAgent: comment.userAgent,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    approvedAt: comment.approvedAt,
  }
}

async function getPostTitle(postId: string, env?: WorkerBindings) {
  const post = await getAdminPostById(postId, env)
  return post?.title ?? null
}

async function findCommentById(id: string, env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    return mockComments.find(comment => comment.id === id) ?? null
  }

  const { data, error } = await adminClient
    .from('comments')
    .select('id, post_id, parent_id, author_name, author_email, body, status, request_ip, user_agent, created_at, updated_at, approved_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return mapDbComment(data as DbCommentRow)
}

async function countRecentSubmissionsByIp(env: WorkerBindings | undefined, requestIp: string | null) {
  if (!requestIp) {
    return 0
  }

  const cutoffIso = new Date(Date.now() - COMMENT_RATE_LIMIT_WINDOW_MS).toISOString()
  const adminClient = env ? createSupabaseAdminClient(env) : null

  if (!adminClient) {
    return mockComments.filter(comment =>
      comment.requestIp === requestIp && comment.createdAt >= cutoffIso,
    ).length
  }

  const { data, error } = await adminClient
    .from('comments')
    .select('id')
    .eq('request_ip', requestIp)
    .gte('created_at', cutoffIso)

  if (error || !data) {
    return 0
  }

  return data.length
}

async function collectDescendantIds(rootId: string, env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  const ids = [rootId]
  const queue = [rootId]

  while (queue.length > 0) {
    const batch = queue.splice(0)
    const children = !adminClient
      ? mockComments.filter(comment => comment.parentId && batch.includes(comment.parentId))
      : await adminClient
          .from('comments')
          .select('id, post_id, parent_id, author_name, author_email, body, status, request_ip, user_agent, created_at, updated_at, approved_at')
          .in('parent_id', batch)
          .then(result => (result.error || !result.data ? [] : (result.data as DbCommentRow[]).map(mapDbComment)))

    for (const child of children) {
      if (!ids.includes(child.id)) {
        ids.push(child.id)
        queue.push(child.id)
      }
    }
  }

  return ids
}

export async function submitComment(
  env: WorkerBindings | undefined,
  postSlug: string,
  payload: Partial<CommentSubmissionPayload> | null,
  meta: CommentSubmissionMeta,
) {
  const post = await getPublishedPostBySlug(postSlug, env)
  if (!post) {
    return { error: 'Post not found.', code: 'NOT_FOUND' as const, comment: null }
  }

  const normalized = normalizeCommentSubmission(payload)
  if (!normalized.authorName || !normalized.authorEmail || !normalized.body) {
    return { error: 'All comment fields are required.', code: 'VALIDATION_ERROR' as const, comment: null }
  }

  if (!isValidEmail(normalized.authorEmail)) {
    return { error: 'Email format is invalid.', code: 'VALIDATION_ERROR' as const, comment: null }
  }

  if (normalized.parentId) {
    const parent = await findCommentById(normalized.parentId, env)
    if (!parent || parent.postId !== post.id) {
      return { error: 'Parent comment is invalid.', code: 'VALIDATION_ERROR' as const, comment: null }
    }
  }

  const recentCount = await countRecentSubmissionsByIp(env, meta.requestIp)
  if (recentCount >= COMMENT_RATE_LIMIT_COUNT) {
    return { error: 'Too many comment submissions. Please try again later.', code: 'RATE_LIMITED' as const, comment: null }
  }

  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const createdAt = nowIso()
    const created: CommentRecord = {
      id: crypto.randomUUID(),
      postId: post.id,
      parentId: normalized.parentId,
      authorName: normalized.authorName,
      authorEmail: normalized.authorEmail,
      body: normalized.body,
      status: 'pending',
      requestIp: meta.requestIp,
      userAgent: meta.userAgent,
      createdAt,
      updatedAt: createdAt,
      approvedAt: null,
    }

    mockComments.unshift(created)
    return { error: null, code: null, comment: created }
  }

  const { data, error } = await adminClient
    .from('comments')
    .insert({
      post_id: post.id,
      parent_id: normalized.parentId,
      author_name: normalized.authorName,
      author_email: normalized.authorEmail,
      body: normalized.body,
      status: 'pending',
      request_ip: meta.requestIp,
      user_agent: meta.userAgent,
    })
    .select('id, post_id, parent_id, author_name, author_email, body, status, request_ip, user_agent, created_at, updated_at, approved_at')
    .single()

  if (error || !data) {
    return { error: 'Failed to submit comment.', code: 'INTERNAL_ERROR' as const, comment: null }
  }

  return { error: null, code: null, comment: mapDbComment(data as DbCommentRow) }
}

export async function listPublicComments(postSlug: string, env?: WorkerBindings) {
  const post = await getPublishedPostBySlug(postSlug, env)
  if (!post) {
    return null
  }

  const adminClient = env ? createSupabaseAdminClient(env) : null
  const comments = !adminClient
    ? mockComments
        .filter(comment => comment.postId === post.id && comment.status === 'approved')
    : await adminClient
        .from('comments')
        .select('id, post_id, parent_id, author_name, author_email, body, status, request_ip, user_agent, created_at, updated_at, approved_at')
        .eq('post_id', post.id)
        .eq('status', 'approved')
        .then(result => (result.error || !result.data ? [] : (result.data as DbCommentRow[]).map(mapDbComment)))

  return {
    items: buildCommentTree(comments),
    total: comments.length,
  }
}

export async function listAdminComments(env: WorkerBindings | undefined, filters: CommentListFilters = {}) {
  const status = filters.status ?? 'all'
  const search = filters.search?.trim().toLowerCase() ?? ''
  const adminClient = env ? createSupabaseAdminClient(env) : null

  const comments = !adminClient
    ? mockComments
    : await adminClient
        .from('comments')
        .select('id, post_id, parent_id, author_name, author_email, body, status, request_ip, user_agent, created_at, updated_at, approved_at')
        .order('created_at', { ascending: false })
        .then(result => (result.error || !result.data ? [] : (result.data as DbCommentRow[]).map(mapDbComment)))

  const filtered = comments
    .filter(comment => status === 'all' || comment.status === status)
    .filter(comment => !filters.postId || comment.postId === filters.postId)
    .filter(comment => {
      if (!search) {
        return true
      }

      return (
        comment.authorName.toLowerCase().includes(search)
        || comment.authorEmail.toLowerCase().includes(search)
        || comment.body.toLowerCase().includes(search)
      )
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return Promise.all(filtered.map(async comment => {
    const parent = comment.parentId ? comments.find(item => item.id === comment.parentId) ?? null : null
    return toAdminListItem(comment, await getPostTitle(comment.postId, env), parent)
  }))
}

export async function getAdminCommentById(id: string, env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  const comment = await findCommentById(id, env)
  if (!comment) {
    return null
  }

  const parent = comment.parentId ? await findCommentById(comment.parentId, env) : null

  if (!adminClient) {
    return toAdminDetail(comment, await getPostTitle(comment.postId, env), parent)
  }

  return toAdminDetail(comment, await getPostTitle(comment.postId, env), parent)
}

export async function updateAdminCommentStatus(
  env: WorkerBindings | undefined,
  id: string,
  status: CommentStatus,
) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  const approvedAt = status === 'approved' ? nowIso() : null

  if (!adminClient) {
    const target = mockComments.find(comment => comment.id === id)
    if (!target) {
      return { error: 'Comment not found.', comment: null }
    }

    target.status = status
    target.updatedAt = nowIso()
    target.approvedAt = approvedAt
    const parent = target.parentId ? mockComments.find(comment => comment.id === target.parentId) ?? null : null
    return { error: null, comment: toAdminDetail(target, await getPostTitle(target.postId, env), parent) }
  }

  const { data, error } = await adminClient
    .from('comments')
    .update({
      status,
      approved_at: approvedAt,
    })
    .eq('id', id)
    .select('id, post_id, parent_id, author_name, author_email, body, status, request_ip, user_agent, created_at, updated_at, approved_at')
    .maybeSingle()

  if (error || !data) {
    return { error: 'Comment not found.', comment: null }
  }

  const comment = mapDbComment(data as DbCommentRow)
  const parent = comment.parentId ? await findCommentById(comment.parentId, env) : null
  return { error: null, comment: toAdminDetail(comment, await getPostTitle(comment.postId, env), parent) }
}

export async function deleteAdminComment(env: WorkerBindings | undefined, id: string) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  const target = await findCommentById(id, env)
  if (!target) {
    return false
  }

  const ids = await collectDescendantIds(id, env)

  if (!adminClient) {
    for (const deleteId of ids) {
      const index = mockComments.findIndex(comment => comment.id === deleteId)
      if (index >= 0) {
        mockComments.splice(index, 1)
      }
    }
    return true
  }

  const { error } = await adminClient
    .from('comments')
    .delete()
    .in('id', ids)

  return !error
}
