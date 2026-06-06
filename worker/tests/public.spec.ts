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

  it('returns tags in posts list payload', async () => {
    const res = await app.request('/api/posts')
    const payload = await res.json() as { data: { items: Array<{ tags?: Array<{ slug: string }> }> } }

    expect(payload.data.items[0]?.tags?.[0]?.slug).toBe('launch')
  })

  it('returns post detail by slug', async () => {
    const res = await app.request('/api/posts/launch-checklist')
    expect(res.status).toBe(200)
  })

  it('returns tags in post detail payload', async () => {
    const res = await app.request('/api/posts/launch-checklist')
    const payload = await res.json() as { data: { tags?: Array<{ slug: string }> } }

    expect(payload.data.tags?.map(tag => tag.slug)).toContain('launch')
  })
})

describe('public tags api', () => {
  it('returns active tags list with post counts', async () => {
    const res = await app.request('/api/tags')
    expect(res.status).toBe(200)

    const payload = await res.json() as { data: { items: Array<{ slug: string, postCount: number }> } }
    expect(payload.data.items.find(tag => tag.slug === 'vue')?.postCount).toBe(1)
  })

  it('returns published posts for active tag slug', async () => {
    const res = await app.request('/api/tags/vue')
    expect(res.status).toBe(200)

    const payload = await res.json() as { data: { tag: { slug: string }, items: Array<{ slug: string }> } }
    expect(payload.data.tag.slug).toBe('vue')
    expect(payload.data.items[0]?.slug).toBe('launch-checklist')
  })

  it('returns 404 for disabled tag slug', async () => {
    const res = await app.request('/api/tags/legacy')
    expect(res.status).toBe(404)
  })
})

