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
})

