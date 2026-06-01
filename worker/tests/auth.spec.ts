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

describe('/api/me', () => {
  it('returns 401 without bearer token', async () => {
    const res = await app.request('/api/me')
    expect(res.status).toBe(401)
  })

  it('returns user profile with valid token', async () => {
    const res = await app.request('/api/me', {
      headers: {
        Authorization: 'Bearer user-token',
      },
    })

    expect(res.status).toBe(200)
  })

  it('returns username in user profile payload for admin-capable sessions', async () => {
    const res = await app.request('/api/me', {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(res.status).toBe(200)

    const payload = await res.json() as {
      success: boolean
      data: {
        username?: string | null
      }
    }

    expect(payload.success).toBe(true)
    expect(payload.data.username).toBe('admin')
  })

  it('returns session payload and writes front login record on successful login', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/auth/v1/token?grant_type=password')) {
        expect(init?.body).toBe(JSON.stringify({ email: 'user@demo.invalid', password: 'secret123' }))
        return createJsonResponse({
          access_token: 'user-access-token',
          refresh_token: 'user-refresh-token',
          expires_in: 3600,
          user: { id: 'user-1', email: 'user@demo.invalid' },
        })
      }

      if (url.includes('/rest/v1/profiles')) {
        return createJsonResponse([{ id: 'user-1', email: 'user@demo.invalid', role: 'user', status: 'active' }])
      }

      if (url.includes('/rest/v1/front_login_records')) {
        expect(init?.method).toBe('POST')
        expect(String(init?.body)).toContain('"login_identifier":"user@demo.invalid"')
        expect(String(init?.body)).toContain('"result":"success"')
        return createJsonResponse([{ id: 'front-record-1' }], 201)
      }

      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    vi.stubGlobal('fetch', fetchMock)

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
        'user-agent': 'VitestBrowser/1.0',
      },
      body: JSON.stringify({ email: 'user@demo.invalid', password: 'secret123' }),
    }, env)

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      success: true,
      data: {
        session: {
          access_token: 'user-access-token',
          refresh_token: 'user-refresh-token',
        },
      },
    })
  })

  it('writes failed front login record when credentials are invalid', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/auth/v1/token?grant_type=password')) {
        return createJsonResponse({ message: 'invalid login' }, 400)
      }

      if (url.includes('/rest/v1/front_login_records')) {
        expect(String(init?.body)).toContain('"login_identifier":"user@demo.invalid"')
        expect(String(init?.body)).toContain('"result":"failure"')
        expect(String(init?.body)).toContain('"failure_reason":"invalid_credentials"')
        return createJsonResponse([{ id: 'front-record-2' }], 201)
      }

      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    vi.stubGlobal('fetch', fetchMock)

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
        'user-agent': 'VitestBrowser/1.0',
      },
      body: JSON.stringify({ email: 'user@demo.invalid', password: 'bad-secret' }),
    }, env)

    expect(res.status).toBe(401)
  })

  it('returns only own login records from /api/me/login-records', async () => {
    const res = await app.request('/api/me/login-records', {
      headers: {
        Authorization: 'Bearer user-token',
      },
    })

    expect(res.status).toBe(200)

    const payload = await res.json() as {
      success: boolean
      data: {
        items: Array<{ user: { id: string }, surface: string }>
      }
    }

    expect(payload.success).toBe(true)
    expect(payload.data.items).toEqual([])
  })
})

