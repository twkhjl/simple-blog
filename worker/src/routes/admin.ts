import { Hono } from 'hono'
import { fail, ok } from '../lib/response'
import { requireAuth } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'
import { getAdminPostById, listAdminPosts } from './posts'
import type { AppEnv } from '../types'

const adminRoutes = new Hono<AppEnv>()

adminRoutes.use('*', requireAuth, requireRole(['editor', 'admin', 'super_admin']))

adminRoutes.get('/posts', c => {
  const user = c.get('user')
  const items = listAdminPosts(user.role === 'editor' ? user.id : undefined)

  return ok({
    items,
    page: Number(c.req.query('page') ?? 1),
    limit: Number(c.req.query('limit') ?? 20),
    total: items.length,
  })
})

adminRoutes.get('/posts/:id', c => {
  const user = c.get('user')
  const post = getAdminPostById(c.req.param('id'))
  if (!post) {
    return fail('NOT_FOUND', 'Post not found', 404)
  }

  if (user.role === 'editor' && post.authorId !== user.id) {
    return fail('FORBIDDEN', 'Insufficient permissions', 403)
  }

  return ok(post)
})

adminRoutes.post('/posts', c => ok({
  id: 'new-post',
  status: 'draft',
}, 201))

adminRoutes.put('/posts/:id', c => ok({
  id: c.req.param('id'),
  updated: true,
}))

adminRoutes.delete('/posts/:id', c => ok({
  id: c.req.param('id'),
  deleted: true,
}))

export default adminRoutes

