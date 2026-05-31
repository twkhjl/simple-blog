import { afterEach, describe, expect, it, vi } from 'vitest'
import app from '../src/index'
import type { WorkerBindings } from '../src/types'

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const env: WorkerBindings = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  PUBLIC_APP_ORIGIN: 'http://localhost:5173',
  PUBLIC_APP_BASE_PATH: '/simple-blog/',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('admin username auth api', () => {
  it('returns 401 when username mapping is missing', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.includes('/rest/v1/admin_accounts')) {
        return createJsonResponse([])
      }

      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    vi.stubGlobal('fetch', fetchMock)

    const res = await app.request('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    }, env)

    expect(res.status).toBe(401)
  })

  it('returns 401 when mapped user lacks admin role', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.includes('/rest/v1/admin_accounts')) {
        return createJsonResponse([{ user_id: 'user-1', is_active: true }])
      }

      if (url.includes('/rest/v1/profiles')) {
        return createJsonResponse([{ id: 'user-1', role: 'user', status: 'active' }])
      }

      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    vi.stubGlobal('fetch', fetchMock)

    const res = await app.request('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'reader', password: 'secret' }),
    }, env)

    expect(res.status).toBe(401)
  })

  it('returns session payload when username and password are valid', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/rest/v1/admin_accounts')) {
        return createJsonResponse([{ user_id: 'admin-1', is_active: true }])
      }

      if (url.includes('/rest/v1/profiles')) {
        return createJsonResponse([{ id: 'admin-1', role: 'admin', status: 'active' }])
      }

      if (url.endsWith('/auth/v1/admin/users/admin-1')) {
        return createJsonResponse({ user: { email: 'admin@demo.invalid' } })
      }

      if (url.includes('/auth/v1/token?grant_type=password')) {
        expect(init?.method).toBe('POST')
        expect(init?.body).toBe(JSON.stringify({ email: 'admin@demo.invalid', password: 'secret' }))

        return createJsonResponse({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'admin-1', email: 'admin@demo.invalid' },
        })
      }

      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    vi.stubGlobal('fetch', fetchMock)

    const res = await app.request('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    }, env)

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      success: true,
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      },
    })
  })

  it('returns 400 when forgot-password email is invalid', async () => {
    const fetchMock = vi.fn(async () => createJsonResponse({ message: 'unexpected' }, 500))

    vi.stubGlobal('fetch', fetchMock)

    const res = await app.request('/api/admin/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad-email' }),
    }, env)

    expect(res.status).toBe(400)
  })

  it('returns 404 when forgot-password email is not an active admin profile', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.includes('/rest/v1/profiles')) {
        return createJsonResponse([])
      }

      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    vi.stubGlobal('fetch', fetchMock)

    const res = await app.request('/api/admin/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.invalid' }),
    }, env)

    expect(res.status).toBe(404)
  })

  it('dispatches forgot-password recovery email for active admin profile', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/rest/v1/profiles')) {
        return createJsonResponse([{ id: 'admin-1', email: 'admin@demo.invalid', role: 'admin', status: 'active' }])
      }

      if (url.includes('/auth/v1/recover')) {
        expect(init?.method).toBe('POST')
        expect(init?.body).toBe(JSON.stringify({
          email: 'admin@demo.invalid',
          redirect_to: 'http://localhost:5173/simple-blog/?admin_reset=1',
        }))
        return createJsonResponse({})
      }

      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    vi.stubGlobal('fetch', fetchMock)

    const res = await app.request('/api/admin/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.invalid' }),
    }, env)

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      success: true,
      data: {
        sent: true,
      },
    })
  })

  it('returns 502 when recovery dispatch fails upstream', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.includes('/rest/v1/profiles')) {
        return createJsonResponse([{ id: 'admin-1', email: 'admin@demo.invalid', role: 'admin', status: 'active' }])
      }

      if (url.includes('/auth/v1/recover')) {
        return createJsonResponse({ message: 'boom' }, 500)
      }

      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    vi.stubGlobal('fetch', fetchMock)

    const res = await app.request('/api/admin/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.invalid' }),
    }, env)

    expect(res.status).toBe(502)
  })

  it('returns 429 when recovery dispatch is rate limited upstream', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.includes('/rest/v1/profiles')) {
        return createJsonResponse([{ id: 'admin-1', email: 'admin@demo.invalid', role: 'admin', status: 'active' }])
      }

      if (url.includes('/auth/v1/recover')) {
        return new Response('', {
          status: 429,
          headers: {
            'x-sb-error-code': 'over_email_send_rate_limit',
          },
        })
      }

      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    vi.stubGlobal('fetch', fetchMock)

    const res = await app.request('/api/admin/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.invalid' }),
    }, env)

    expect(res.status).toBe(429)
    expect(await res.json()).toMatchObject({
      success: false,
      error: {
        code: 'RATE_LIMITED',
      },
    })
  })
})
