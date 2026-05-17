import { Hono } from 'hono'
import { fail, ok } from '../lib/response'
import { requireAuth } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'
import { createAdminPost, deleteAdminPost, getAdminPostById, listAdminPosts, updateAdminPost } from './posts'
import type { AppEnv } from '../types'

const adminRoutes = new Hono<AppEnv>()

adminRoutes.use('*', requireAuth, requireRole(['editor', 'admin', 'super_admin']))

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

    return ok(post)
  })
})

adminRoutes.post('/posts', async c => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null) as {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    coverImageKey?: string | null
    status?: 'draft' | 'published' | 'archived'
    publishedAt?: string | null
  } | null

  if (!body?.title || !body.slug || !body.content || !body.status) {
    return fail('VALIDATION_ERROR', 'Missing required fields', 400)
  }

  const post = await createAdminPost(c.env, user, {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt ?? '',
    content: body.content,
    coverImageKey: body.coverImageKey ?? null,
    status: body.status,
    publishedAt: body.publishedAt ?? null,
  })

  if (!post) {
    return fail('INTERNAL_ERROR', 'Failed to create post', 500)
  }

  return ok(post, 201)
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
    status?: 'draft' | 'published' | 'archived'
    publishedAt?: string | null
  } | null

  if (!body?.title || !body.slug || !body.content || !body.status) {
    return fail('VALIDATION_ERROR', 'Missing required fields', 400)
  }

  const post = await updateAdminPost(c.env, c.req.param('id'), {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt ?? '',
    content: body.content,
    coverImageKey: body.coverImageKey ?? null,
    status: body.status,
    publishedAt: body.publishedAt ?? null,
  })

  if (!post) {
    return fail('INTERNAL_ERROR', 'Failed to update post', 500)
  }

  return ok(post)
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
