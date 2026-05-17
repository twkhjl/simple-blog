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
app.get('/files/*', () => fail('NOT_FOUND', 'File not found', 404))

app.route('/api', publicRoutes)
app.route('/api', authRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/files', fileRoutes)

export default app
