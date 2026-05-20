import { Hono } from 'hono'
import { buildFileUrl } from '../lib/r2'
import { fail, ok } from '../lib/response'
import { requireAuth } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'
import type { AppEnv } from '../types'

const fileRoutes = new Hono<AppEnv>()

fileRoutes.use('/upload', requireAuth, requireRole(['editor', 'admin', 'super_admin']))

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_FILE_SIZE = 5 * 1024 * 1024

function slugifyFileName(name: string) {
  const dotIndex = name.lastIndexOf('.')
  const baseName = dotIndex === -1 ? name : name.slice(0, dotIndex)
  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file'
}

fileRoutes.post('/upload', async c => {
  const data = await c.req.formData().catch(() => null)
  if (!data) {
    return fail('VALIDATION_ERROR', 'multipart form data required', 400)
  }

  const folder = data.get('folder')
  if (folder !== null && folder !== 'posts') {
    return fail('VALIDATION_ERROR', 'folder must be posts', 400)
  }

  const fileEntry = data.get('file')
  if (fileEntry == null || typeof fileEntry === 'string') {
    return fail('VALIDATION_ERROR', 'file is required', 400)
  }
  const file = fileEntry as File

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return fail('VALIDATION_ERROR', 'unsupported file type', 400)
  }

  if (file.size > MAX_FILE_SIZE) {
    return fail('VALIDATION_ERROR', 'file too large', 400)
  }

  const bucket = c.env?.FILES_BUCKET
  if (!bucket) {
    return fail('INTERNAL_ERROR', 'Files bucket is not configured', 500)
  }

  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const fileName = file.name || 'upload.bin'
  const extensionMatch = /\.[a-z0-9]+$/i.exec(fileName)
  const extension = extensionMatch?.[0] ?? ''
  const safeName = slugifyFileName(fileName)
  const key = `posts/${year}/${month}/${Date.now()}-${safeName}${extension.toLowerCase()}`

  await bucket.put(key, file, {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
  })

  return ok({
    key,
    url: buildFileUrl(c.env, key),
    fileName,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  })
})

export default fileRoutes

