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

describe('public contact api', () => {
  it('creates a contact message', async () => {
    const res = await app.request('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.10',
      },
      body: JSON.stringify({
        name: 'Reader',
        email: 'reader@example.com',
        subject: 'Need help',
        message: 'Please contact me about consulting.',
      }),
    })

    expect(res.status).toBe(201)
  })

  it('rejects invalid contact payload', async () => {
    const res = await app.request('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.11',
      },
      body: JSON.stringify({
        name: 'Reader',
        email: 'bad-email',
        subject: '',
        message: 'hello',
      }),
    })

    expect(res.status).toBe(400)
  })

  it('rate limits repeated contact submissions from same ip', async () => {
    const ip = '198.51.100.12'

    for (let index = 0; index < 3; index += 1) {
      const res = await app.request('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': ip,
        },
        body: JSON.stringify({
          name: `Reader ${index}`,
          email: `reader${index}@example.com`,
          subject: 'Need help',
          message: 'Please contact me about consulting.',
        }),
      })

      expect(res.status).toBe(201)
    }

    const blockedRes = await app.request('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': ip,
      },
      body: JSON.stringify({
        name: 'Reader 4',
        email: 'reader4@example.com',
        subject: 'Need help',
        message: 'Please contact me about consulting.',
      }),
    })

    expect(blockedRes.status).toBe(429)
  })
})

describe('public comments api', () => {
  it('creates a pending top-level comment for a published post', async () => {
    const res = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.30',
      },
      body: JSON.stringify({
        authorName: 'Reader',
        authorEmail: 'reader@example.com',
        body: 'First comment',
      }),
    })

    expect(res.status).toBe(201)
  })

  it('creates a pending reply comment under same post', async () => {
    const firstRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.31',
      },
      body: JSON.stringify({
        authorName: 'Parent',
        authorEmail: 'parent@example.com',
        body: 'Parent comment',
      }),
    })
    const firstPayload = await firstRes.json() as { data: { id: string } }

    const replyRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.31',
      },
      body: JSON.stringify({
        authorName: 'Reply',
        authorEmail: 'reply@example.com',
        body: 'Nested reply',
        parentId: firstPayload.data.id,
      }),
    })

    expect(replyRes.status).toBe(201)
  })

  it('rejects invalid comment payloads and cross-post parent ids', async () => {
    const invalidRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.32',
      },
      body: JSON.stringify({
        authorName: 'Reader',
        authorEmail: 'bad-email',
        body: '',
      }),
    })

    expect(invalidRes.status).toBe(400)

    const parentRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.33',
      },
      body: JSON.stringify({
        authorName: 'Parent',
        authorEmail: 'parent@example.com',
        body: 'Parent',
      }),
    })
    const parentPayload = await parentRes.json() as { data: { id: string } }

    const crossPostRes = await app.request('/api/posts/second-published-post/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.33',
      },
      body: JSON.stringify({
        authorName: 'Reply',
        authorEmail: 'reply@example.com',
        body: 'Should fail',
        parentId: parentPayload.data.id,
      }),
    })

    expect(crossPostRes.status).toBe(400)
  })

  it('rate limits repeated comment submissions from same ip', async () => {
    const ip = '198.51.100.34'

    for (let index = 0; index < 3; index += 1) {
      const res = await app.request('/api/posts/launch-checklist/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': ip,
        },
        body: JSON.stringify({
          authorName: `Reader ${index}`,
          authorEmail: `reader${index}@example.com`,
          body: `Comment ${index}`,
        }),
      })

      expect(res.status).toBe(201)
    }

    const blockedRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': ip,
      },
      body: JSON.stringify({
        authorName: 'Reader 4',
        authorEmail: 'reader4@example.com',
        body: 'Blocked comment',
      }),
    })

    expect(blockedRes.status).toBe(429)
  })

  it('lists only approved comments in threaded order', async () => {
    const parentRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.35',
      },
      body: JSON.stringify({
        authorName: 'Old Parent',
        authorEmail: 'old-parent@example.com',
        body: 'Old parent body',
      }),
    })
    const newerParentRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.36',
      },
      body: JSON.stringify({
        authorName: 'New Parent',
        authorEmail: 'new-parent@example.com',
        body: 'New parent body',
      }),
    })

    const olderParent = await parentRes.json() as { data: { id: string } }
    const newerParent = await newerParentRes.json() as { data: { id: string } }

    const olderReplyRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.35',
      },
      body: JSON.stringify({
        authorName: 'Older Reply',
        authorEmail: 'older-reply@example.com',
        body: 'Older reply body',
        parentId: olderParent.data.id,
      }),
    })
    const newerReplyRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.35',
      },
      body: JSON.stringify({
        authorName: 'Newer Reply',
        authorEmail: 'newer-reply@example.com',
        body: 'Newer reply body',
        parentId: olderParent.data.id,
      }),
    })

    const olderReply = await olderReplyRes.json() as { data: { id: string } }
    const newerReply = await newerReplyRes.json() as { data: { id: string } }

    for (const id of [olderParent.data.id, newerParent.data.id, olderReply.data.id, newerReply.data.id]) {
      const approveRes = await app.request(`/api/admin/comments/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      })

      expect(approveRes.status).toBe(200)
    }

    const hiddenRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.37',
      },
      body: JSON.stringify({
        authorName: 'Hidden Parent',
        authorEmail: 'hidden@example.com',
        body: 'Hidden body',
      }),
    })
    const hiddenPayload = await hiddenRes.json() as { data: { id: string } }
    await app.request(`/api/admin/comments/${hiddenPayload.data.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'hidden' }),
    })

    const res = await app.request('/api/posts/launch-checklist/comments')
    expect(res.status).toBe(200)

    const payload = await res.json() as {
      data: {
        items: Array<{
          id: string
          replies: Array<{ id: string }>
        }>
      }
    }

    expect(payload.data.items.map(item => item.id)).toEqual([newerParent.data.id, olderParent.data.id])
    expect(payload.data.items[1]?.replies.map(reply => reply.id)).toEqual([olderReply.data.id, newerReply.data.id])
  })
})

