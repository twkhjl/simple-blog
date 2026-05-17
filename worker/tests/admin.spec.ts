import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('admin posts api', () => {
  it('returns 401 without token', async () => {
    const res = await app.request('/api/admin/posts')
    expect(res.status).toBe(401)
  })

  it('returns 403 for user role', async () => {
    const res = await app.request('/api/admin/posts', {
      headers: {
        Authorization: 'Bearer user-token',
      },
    })

    expect(res.status).toBe(403)
  })

  it('returns 200 for editor role', async () => {
    const res = await app.request('/api/admin/posts', {
      headers: {
        Authorization: 'Bearer editor-token',
      },
    })

    expect(res.status).toBe(200)
  })
})

