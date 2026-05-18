import { Hono } from 'hono'
import { buildFileUrl } from '../lib/r2'
import { fail, ok } from '../lib/response'
import { requireAuth } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'
import type { AppEnv } from '../types'

const fileRoutes = new Hono<AppEnv>()

fileRoutes.use('/upload', requireAuth, requireRole(['editor', 'admin', 'super_admin']))

fileRoutes.post('/upload', c => {
  const formData = c.req.formData().catch(() => null)

  return formData.then(data => {
    const folder = data?.get('folder')
    if (folder !== null && folder !== 'posts') {
      return fail('VALIDATION_ERROR', 'folder must be posts', 400)
    }

    const key = 'posts/2026/05/sample-image.webp'
    return ok({
      key,
      url: buildFileUrl(c.env, key),
      fileName: 'sample-image.webp',
      mimeType: 'image/webp',
      size: 100,
    })
  })
})

export default fileRoutes

