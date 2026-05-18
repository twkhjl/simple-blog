import { cors } from 'hono/cors'
import { Hono } from 'hono'
import adminRoutes from './routes/admin'
import authRoutes from './routes/auth'
import fileRoutes from './routes/files'
import publicRoutes from './routes/public'
import { fail, ok } from './lib/response'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const configuredOrigin = c.env?.PUBLIC_APP_ORIGIN
      if (!origin) {
        return origin
      }

      if (configuredOrigin && origin === configuredOrigin) {
        return origin
      }

      if (origin.startsWith('http://localhost:')) {
        return origin
      }

      return configuredOrigin ?? origin
    },
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/health', () => ok({ ok: true }))
app.get('/files/*', async c => {
  const key = decodeURIComponent(c.req.path.replace(/^\/files\//, ''))
  if (!key) {
    return fail('NOT_FOUND', 'File not found', 404)
  }

  const bucket = c.env?.FILES_BUCKET
  if (!bucket) {
    return fail('INTERNAL_ERROR', 'Files bucket is not configured', 500)
  }

  const object = await bucket.get(key)
  if (!object) {
    return fail('NOT_FOUND', 'File not found', 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)

  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/octet-stream')
  }

  return new Response(object.body, { headers })
})

app.route('/api', publicRoutes)
app.route('/api', authRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/files', fileRoutes)

export default app
