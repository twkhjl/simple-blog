import { describe, expect, it } from 'vitest'
import app from '../src/index'

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
})

