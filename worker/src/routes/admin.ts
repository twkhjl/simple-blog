import { Hono } from 'hono'
import { isMeaningfulRichText, sanitizeRichTextHtml } from '../lib/content'
import { listLoginRecords } from '../lib/loginRecords'
import { buildFileUrl } from '../lib/r2'
import { fail, ok } from '../lib/response'
import { requireAuth } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'
import { createAdminPost, createAdminTag, deleteAdminPost, getAdminPostById, listAdminPosts, listAdminTags, updateAdminPost, updateAdminTag, updateAdminTagStatus } from './posts'
import type { AppEnv, TagStatus, WorkerBindings } from '../types'

const adminRoutes = new Hono<AppEnv>()
const MIN_PASSWORD_LENGTH = 8

function getServiceHeaders(env: WorkerBindings) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
    'content-type': 'application/json',
  }
}

async function verifyCurrentPassword(email: string, password: string, env: WorkerBindings) {
  const response = await fetch(new URL('/auth/v1/token?grant_type=password', env.SUPABASE_URL), {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_ANON_KEY ?? '',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  return response.ok
}

async function updateAdminPassword(userId: string, newPassword: string, env: WorkerBindings) {
  const response = await fetch(new URL(`/auth/v1/admin/users/${userId}`, env.SUPABASE_URL), {
    method: 'PUT',
    headers: getServiceHeaders(env),
    body: JSON.stringify({ password: newPassword }),
  })

  return response.ok
}

function serializeAdminPost(post: Awaited<ReturnType<typeof getAdminPostById>>, env: AppEnv['Bindings']) {
  if (!post) {
    return null
  }

  return {
    ...post,
    coverImageUrl: post.coverImageKey ? buildFileUrl(env, post.coverImageKey) : null,
  }
}

adminRoutes.use('*', requireAuth, requireRole(['editor', 'admin', 'super_admin']))

adminRoutes.get('/login-records', requireRole(['admin', 'super_admin']), async c => {
  const page = Number(c.req.query('page') ?? 1)
  const result = c.req.query('result')
  const identifier = c.req.query('identifier') ?? ''

  return ok(await listLoginRecords(c.env, 'admin', {
    page,
    identifier,
    result: result === 'success' || result === 'failure' ? result : 'all',
  }))
})

adminRoutes.get('/user-login-records', requireRole(['admin', 'super_admin']), async c => {
  const page = Number(c.req.query('page') ?? 1)
  const result = c.req.query('result')
  const identifier = c.req.query('identifier') ?? ''
  const surface = c.req.query('surface') === 'front' ? 'front' : 'admin'

  return ok(await listLoginRecords(c.env, surface, {
    page,
    identifier,
    result: result === 'success' || result === 'failure' ? result : 'all',
  }))
})

adminRoutes.post('/change-password', async c => {
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_ANON_KEY || !c.env.SUPABASE_SERVICE_ROLE_KEY) {
    return fail('CONFIG_ERROR', 'Password update is unavailable.', 500)
  }

  const user = c.get('user')
  const body = await c.req.json().catch(() => null) as {
    currentPassword?: string
    newPassword?: string
  } | null

  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword || !newPassword) {
    return fail('VALIDATION_ERROR', 'Current password and new password are required.', 400)
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return fail('INVALID_NEW_PASSWORD', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 400)
  }

  if (currentPassword === newPassword) {
    return fail('INVALID_NEW_PASSWORD', 'New password must be different from current password.', 400)
  }

  const currentPasswordValid = await verifyCurrentPassword(user.email, currentPassword, c.env)
  if (!currentPasswordValid) {
    return fail('INVALID_CURRENT_PASSWORD', 'Current password is incorrect.', 400)
  }

  const updated = await updateAdminPassword(user.id, newPassword, c.env)
  if (!updated) {
    return fail('PASSWORD_UPDATE_FAILED', 'Failed to update password.', 502)
  }

  return ok({ success: true })
})

adminRoutes.get('/posts', c => {
  const user = c.get('user')
  return listAdminPosts(c.env, user.role === 'editor' ? user.id : undefined).then(items =>
    ok({
      items,
      page: Number(c.req.query('page') ?? 1),
      limit: Number(c.req.query('limit') ?? 20),
      total: items.length,
    }),
  )
})

adminRoutes.get('/posts/:id', c => {
  const user = c.get('user')
  return getAdminPostById(c.req.param('id'), c.env).then(post => {
    if (!post) {
      return fail('NOT_FOUND', 'Post not found', 404)
    }

    if (user.role === 'editor' && post.authorId !== user.id) {
      return fail('FORBIDDEN', 'Insufficient permissions', 403)
    }

    return ok(serializeAdminPost(post, c.env))
  })
})

adminRoutes.get('/tags', async c => {
  const items = await listAdminTags(c.env)
  return ok({
    items,
    total: items.length,
  })
})

adminRoutes.post('/tags', async c => {
  const body = await c.req.json().catch(() => null) as { name?: string } | null
  if (!body?.name?.trim()) {
    return fail('VALIDATION_ERROR', 'Tag name is required', 400)
  }

  const result = await createAdminTag(c.env, body.name)
  if (result.error || !result.tag) {
    return fail('VALIDATION_ERROR', result.error ?? 'Failed to create tag', 400)
  }

  return ok(result.tag, 201)
})

adminRoutes.put('/tags/:id', async c => {
  const body = await c.req.json().catch(() => null) as { name?: string } | null
  if (!body?.name?.trim()) {
    return fail('VALIDATION_ERROR', 'Tag name is required', 400)
  }

  const result = await updateAdminTag(c.env, c.req.param('id'), body.name)
  if (result.error || !result.tag) {
    const code = result.error === 'Tag not found.' ? 404 : 400
    return fail('VALIDATION_ERROR', result.error ?? 'Failed to update tag', code)
  }

  return ok(result.tag)
})

adminRoutes.patch('/tags/:id/status', async c => {
  const body = await c.req.json().catch(() => null) as { status?: TagStatus } | null
  if (body?.status !== 'active' && body?.status !== 'disabled') {
    return fail('VALIDATION_ERROR', 'Tag status is invalid', 400)
  }

  const result = await updateAdminTagStatus(c.env, c.req.param('id'), body.status)
  if (result.error || !result.tag) {
    const code = result.error === 'Tag not found.' ? 404 : 400
    return fail('VALIDATION_ERROR', result.error ?? 'Failed to update tag status', code)
  }

  return ok(result.tag)
})

adminRoutes.post('/posts', async c => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null) as {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    coverImageKey?: string | null
    tags?: string[]
    status?: 'draft' | 'published' | 'archived'
    publishedAt?: string | null
  } | null

  if (!body?.title || !body.slug || !body.content || !body.status) {
    return fail('VALIDATION_ERROR', 'Missing required fields', 400)
  }

  const content = sanitizeRichTextHtml(body.content)
  if (!isMeaningfulRichText(content)) {
    return fail('VALIDATION_ERROR', 'Content must not be empty', 400)
  }

  const post = await createAdminPost(c.env, user, {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt ?? '',
    content,
    coverImageKey: body.coverImageKey ?? null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    status: body.status,
    publishedAt: body.publishedAt ?? null,
  })

  if (post.error || !post.post) {
    return fail('VALIDATION_ERROR', post.error ?? 'Failed to create post', 400)
  }

  return ok(serializeAdminPost(post.post, c.env), 201)
})

adminRoutes.put('/posts/:id', async c => {
  const user = c.get('user')
  const current = await getAdminPostById(c.req.param('id'), c.env)
  if (!current) {
    return fail('NOT_FOUND', 'Post not found', 404)
  }

  if (user.role === 'editor' && current.authorId !== user.id) {
    return fail('FORBIDDEN', 'Insufficient permissions', 403)
  }

  const body = await c.req.json().catch(() => null) as {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    coverImageKey?: string | null
    tags?: string[]
    status?: 'draft' | 'published' | 'archived'
    publishedAt?: string | null
  } | null

  if (!body?.title || !body.slug || !body.content || !body.status) {
    return fail('VALIDATION_ERROR', 'Missing required fields', 400)
  }

  const content = sanitizeRichTextHtml(body.content)
  if (!isMeaningfulRichText(content)) {
    return fail('VALIDATION_ERROR', 'Content must not be empty', 400)
  }

  const post = await updateAdminPost(c.env, c.req.param('id'), {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt ?? '',
    content,
    coverImageKey: body.coverImageKey ?? null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    status: body.status,
    publishedAt: body.publishedAt ?? null,
  })

  if (post.error || !post.post) {
    return fail('VALIDATION_ERROR', post.error ?? 'Failed to update post', 400)
  }

  return ok(serializeAdminPost(post.post, c.env))
})

adminRoutes.delete('/posts/:id', async c => {
  const user = c.get('user')
  const current = await getAdminPostById(c.req.param('id'), c.env)
  if (!current) {
    return fail('NOT_FOUND', 'Post not found', 404)
  }

  if (user.role === 'editor' && current.authorId !== user.id) {
    return fail('FORBIDDEN', 'Insufficient permissions', 403)
  }

  const deleted = await deleteAdminPost(c.env, c.req.param('id'))
  if (!deleted) {
    return fail('INTERNAL_ERROR', 'Failed to delete post', 500)
  }

  return ok({
    id: c.req.param('id'),
    deleted: true,
  })
})

export default adminRoutes
