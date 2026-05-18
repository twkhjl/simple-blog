import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('worker health', () => {
  it('returns ok from health endpoint', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
  })
})

describe('public posts api', () => {
  it('returns 200 for posts list', async () => {
    const res = await app.request('/api/posts')
    expect(res.status).toBe(200)
  })

  it('returns post detail by slug', async () => {
    const res = await app.request('/api/posts/launch-checklist')
    expect(res.status).toBe(200)
  })
})

