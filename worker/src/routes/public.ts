import { Hono } from 'hono'
import { fail, ok } from '../lib/response'
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

export default publicRoutes
