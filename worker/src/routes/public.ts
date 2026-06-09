import { Hono } from 'hono'
import { fail, ok } from '../lib/response'
import { listPublicComments, submitComment } from './comments'
import { submitContactMessage } from './contact'
import { getPublicTagPostsBySlug, getPublishedPostBySlug, listPublicTags, listPublishedPosts } from './posts'
import type { AppEnv } from '../types'

const publicRoutes = new Hono<AppEnv>()

publicRoutes.get('/posts', c => {
  return listPublishedPosts(c.env).then(items =>
    ok({
      items,
      page: Number(c.req.query('page') ?? 1),
      limit: Number(c.req.query('limit') ?? 10),
      total: items.length,
    }),
  )
})

publicRoutes.get('/posts/:slug', c => {
  return getPublishedPostBySlug(c.req.param('slug'), c.env).then(post => {
    if (!post) {
      return fail('NOT_FOUND', 'Post not found', 404)
    }

    return ok(post)
  })
})

publicRoutes.get('/posts/:slug/comments', c => {
  return listPublicComments(c.req.param('slug'), c.env).then(payload => {
    if (!payload) {
      return fail('NOT_FOUND', 'Post not found', 404)
    }

    return ok(payload)
  })
})

publicRoutes.post('/posts/:slug/comments', async c => {
  const body = await c.req.json().catch(() => null) as {
    authorName?: string
    authorEmail?: string
    body?: string
    parentId?: string | null
  } | null

  const requestIp = c.req.header('CF-Connecting-IP')
    ?? c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? null
  const userAgent = c.req.header('User-Agent') ?? null
  const result = await submitComment(c.env, c.req.param('slug'), body, { requestIp, userAgent })

  if (result.error) {
    const status = result.code === 'RATE_LIMITED'
      ? 429
      : result.code === 'VALIDATION_ERROR'
        ? 400
        : result.code === 'NOT_FOUND'
          ? 404
          : 500
    return fail(result.code ?? 'INTERNAL_ERROR', result.error, status)
  }

  return ok({ id: result.comment?.id, success: true }, 201)
})

publicRoutes.get('/tags', c => {
  return listPublicTags(c.env).then(items =>
    ok({
      items,
      total: items.length,
    }),
  )
})

publicRoutes.get('/tags/:slug', c => {
  return getPublicTagPostsBySlug(c.req.param('slug'), c.env).then(payload => {
    if (!payload) {
      return fail('NOT_FOUND', 'Tag not found', 404)
    }

    return ok(payload)
  })
})

publicRoutes.post('/contact', async c => {
  const body = await c.req.json().catch(() => null) as {
    name?: string
    email?: string
    subject?: string
    message?: string
  } | null

  const requestIp = c.req.header('CF-Connecting-IP')
    ?? c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? null
  const userAgent = c.req.header('User-Agent') ?? null
  const result = await submitContactMessage(c.env, body, { requestIp, userAgent })

  if (result.error) {
    const status = result.code === 'RATE_LIMITED' ? 429 : result.code === 'VALIDATION_ERROR' ? 400 : 500
    return fail(result.code ?? 'INTERNAL_ERROR', result.error, status)
  }

  return ok({ success: true }, 201)
})

export default publicRoutes
