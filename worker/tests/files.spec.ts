import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('files upload api', () => {
  it('returns 401 without token', async () => {
    const res = await app.request('/api/files/upload', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns 200 for editor upload request', async () => {
    const formData = new FormData()
    formData.set('folder', 'posts')

    const res = await app.request('/api/files/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
      },
      body: formData,
    })

    expect(res.status).toBe(200)
  })
})
