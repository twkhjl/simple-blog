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

  it('returns paginated posts with stats for admin role', async () => {
    const res = await app.request('/api/admin/posts?page=1&limit=1', {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(res.status).toBe(200)
    const payload = await res.json() as {
      data: {
        items: Array<{ id: string }>
        page: number
        limit: number
        total: number
        stats: {
          total: number
          draft: number
          published: number
          archived: number
        }
      }
    }
    expect(payload.data.page).toBe(1)
    expect(payload.data.limit).toBe(1)
    expect(payload.data.total).toBeGreaterThanOrEqual(2)
    expect(payload.data.items).toHaveLength(1)
    expect(payload.data.stats).toEqual({
      total: payload.data.total,
      draft: 1,
      published: 2,
      archived: 0,
    })
  })

  it('returns second page without repeating first page items', async () => {
    const firstRes = await app.request('/api/admin/posts?page=1&limit=1', {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })
    const secondRes = await app.request('/api/admin/posts?page=2&limit=1', {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(firstRes.status).toBe(200)
    expect(secondRes.status).toBe(200)

    const firstPayload = await firstRes.json() as { data: { items: Array<{ id: string }> } }
    const secondPayload = await secondRes.json() as { data: { items: Array<{ id: string }>, page: number } }

    expect(secondPayload.data.page).toBe(2)
    expect(firstPayload.data.items[0]?.id).not.toBe(secondPayload.data.items[0]?.id)
  })

  it('paginates editor-visible posts only and reports editor-only stats', async () => {
    const res = await app.request('/api/admin/posts?page=1&limit=1', {
      headers: {
        Authorization: 'Bearer editor-token',
      },
    })

    expect(res.status).toBe(200)
    const payload = await res.json() as {
      data: {
        items: Array<{ authorId: string }>
        total: number
        stats: {
          total: number
          draft: number
          published: number
          archived: number
        }
      }
    }

    expect(payload.data.items).toHaveLength(1)
    expect(payload.data.items[0]?.authorId).toBe('editor-1')
    expect(payload.data.total).toBe(3)
    expect(payload.data.stats).toEqual({
      total: 3,
      draft: 1,
      published: 2,
      archived: 0,
    })
  })

  it('creates a draft post for editor role', async () => {
    const res = await app.request('/api/admin/posts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Created from test',
        slug: 'created-from-test',
        excerpt: 'excerpt',
        content: '# content',
        tags: ['Vue', 'Release'],
        status: 'draft',
        publishedAt: null,
      }),
    })

    expect(res.status).toBe(201)
    const payload = await res.json() as { data: { slug: string, title: string, tags: Array<{ slug: string }> } }
    expect(payload.data.slug).toBe('created-from-test')
    expect(payload.data.title).toBe('Created from test')
    expect(payload.data.tags.map(tag => tag.slug)).toEqual(['vue', 'release'])
  })

  it('updates an existing post for editor owner', async () => {
    const res = await app.request('/api/admin/posts/post-2', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated Draft',
        slug: 'review-queue-note',
        excerpt: 'updated excerpt',
        content: '# updated',
        tags: ['Vue'],
        status: 'draft',
        publishedAt: null,
      }),
    })

    expect(res.status).toBe(200)
    const payload = await res.json() as { data: { title: string, excerpt: string } }
    expect(payload.data.title).toBe('Updated Draft')
    expect(payload.data.excerpt).toBe('updated excerpt')
  })

  it('sanitizes html content before creating a post', async () => {
    const res = await app.request('/api/admin/posts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Sanitized post',
        slug: 'sanitized-post',
        excerpt: 'excerpt',
        content: '<p>Hello</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>',
        status: 'draft',
        publishedAt: null,
      }),
    })

    expect(res.status).toBe(201)
    const payload = await res.json() as { data: { content: string } }
    expect(payload.data.content).toBe('<p>Hello</p><a>bad</a>')
  })

  it('keeps uploaded inline images when saving a post', async () => {
    const res = await app.request('/api/admin/posts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Inline image post',
        slug: 'inline-image-post',
        excerpt: 'excerpt',
        content: '<p><img src="https://cdn.example.com/files/posts/2026/05/editor.webp" alt="editor.webp"></p>',
        status: 'draft',
        publishedAt: null,
      }),
    })

    expect(res.status).toBe(201)
    const payload = await res.json() as { data: { content: string } }
    expect(payload.data.content).toBe('<p><img src="https://cdn.example.com/files/posts/2026/05/editor.webp" alt="editor.webp" /></p>')
  })

  it('rejects empty rich text content after sanitization', async () => {
    const res = await app.request('/api/admin/posts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Empty post',
        slug: 'empty-post',
        excerpt: 'excerpt',
        content: '<p><br></p>',
        status: 'draft',
        publishedAt: null,
      }),
    })

    expect(res.status).toBe(400)
  })

  it('deletes an existing post for editor owner', async () => {
    const createRes = await app.request('/api/admin/posts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Delete me',
        slug: 'delete-me',
        excerpt: 'delete',
        content: '# delete',
        tags: [],
        status: 'draft',
        publishedAt: null,
      }),
    })

    const created = await createRes.json() as { data: { id: string } }

    const res = await app.request(`/api/admin/posts/${created.data.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer editor-token',
      },
    })

    expect(res.status).toBe(200)
  })

  it('rejects disabled tag during post create', async () => {
    const res = await app.request('/api/admin/posts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Disabled tag post',
        slug: 'disabled-tag-post',
        excerpt: 'excerpt',
        content: '# content',
        tags: ['Legacy'],
        status: 'draft',
        publishedAt: null,
      }),
    })

    expect(res.status).toBe(400)
  })

  it('creates a chinese tag slug during post create', async () => {
    const res = await app.request('/api/admin/posts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Chinese tag post',
        slug: 'chinese-tag-post',
        excerpt: 'excerpt',
        content: '# content',
        tags: ['西子灣'],
        status: 'draft',
        publishedAt: null,
      }),
    })

    expect(res.status).toBe(201)
    const payload = await res.json() as { data: { tags: Array<{ slug: string }> } }
    expect(payload.data.tags.map(tag => tag.slug)).toEqual(['西子灣'])
  })
})

describe('admin tags api', () => {
  it('lists tags for editor role', async () => {
    const res = await app.request('/api/admin/tags', {
      headers: {
        Authorization: 'Bearer editor-token',
      },
    })

    expect(res.status).toBe(200)
  })

  it('renames tag and recalculates slug', async () => {
    const res = await app.request('/api/admin/tags/tag-vue', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Vue.js',
      }),
    })

    expect(res.status).toBe(200)
    const payload = await res.json() as { data: { slug: string } }
    expect(payload.data.slug).toBe('vuejs')
  })

  it('toggles tag status', async () => {
    const res = await app.request('/api/admin/tags/tag-release/status', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'disabled',
      }),
    })

    expect(res.status).toBe(200)
    const payload = await res.json() as { data: { status: string } }
    expect(payload.data.status).toBe('disabled')
  })

  it('deletes tag and preserves posts', async () => {
    const createTagRes = await app.request('/api/admin/tags', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Disposable',
      }),
    })

    const createdTag = await createTagRes.json() as { data: { id: string } }
    const deleteRes = await app.request(`/api/admin/tags/${createdTag.data.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer editor-token',
      },
    })

    expect(deleteRes.status).toBe(200)

    const postsRes = await app.request('/api/posts')
    expect(postsRes.status).toBe(200)
  })

  it('returns 404 when deleting missing tag', async () => {
    const res = await app.request('/api/admin/tags/missing-tag', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer editor-token',
      },
    })

    expect(res.status).toBe(404)
  })
})

describe('admin contact messages api', () => {
  it('rejects editor access to contact messages', async () => {
    const res = await app.request('/api/admin/contact-messages', {
      headers: {
        Authorization: 'Bearer editor-token',
      },
    })

    expect(res.status).toBe(403)
  })

  it('lists contact messages for admin role', async () => {
    const res = await app.request('/api/admin/contact-messages', {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(res.status).toBe(200)
    const payload = await res.json() as { data: { items: Array<{ id: string }> } }
    expect(payload.data.items.length).toBeGreaterThan(0)
  })

  it('returns contact message detail for admin role', async () => {
    const listRes = await app.request('/api/admin/contact-messages', {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })
    const listPayload = await listRes.json() as { data: { items: Array<{ id: string }> } }

    const detailRes = await app.request(`/api/admin/contact-messages/${listPayload.data.items[0].id}`, {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(detailRes.status).toBe(200)
  })

  it('updates contact message status for admin role', async () => {
    const listRes = await app.request('/api/admin/contact-messages', {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })
    const listPayload = await listRes.json() as { data: { items: Array<{ id: string }> } }

    const updateRes = await app.request(`/api/admin/contact-messages/${listPayload.data.items[0].id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'processed',
      }),
    })

    expect(updateRes.status).toBe(200)
    const payload = await updateRes.json() as { data: { status: string, processedAt: string | null } }
    expect(payload.data.status).toBe('processed')
    expect(payload.data.processedAt).not.toBeNull()
  })
})

describe('admin comments api', () => {
  it('rejects editor access to comment management', async () => {
    const res = await app.request('/api/admin/comments', {
      headers: {
        Authorization: 'Bearer editor-token',
      },
    })

    expect(res.status).toBe(403)
  })

  it('lists comments for admin role with filters', async () => {
    const createRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.40',
      },
      body: JSON.stringify({
        authorName: 'Admin Reader',
        authorEmail: 'admin-reader@example.com',
        body: 'Need review here',
      }),
    })
    const created = await createRes.json() as { data: { id: string } }

    const listRes = await app.request('/api/admin/comments?status=pending&search=Need', {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(listRes.status).toBe(200)
    const payload = await listRes.json() as { data: { items: Array<{ id: string, postTitle: string }> } }
    expect(payload.data.items.some(item => item.id === created.data.id)).toBe(true)
    expect(payload.data.items[0]?.postTitle).toBeTruthy()
  })

  it('returns comment detail, updates status, and deletes subtree', async () => {
    const parentRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.41',
      },
      body: JSON.stringify({
        authorName: 'Parent',
        authorEmail: 'parent@example.com',
        body: 'Delete me',
      }),
    })
    const parent = await parentRes.json() as { data: { id: string } }

    const replyRes = await app.request('/api/posts/launch-checklist/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.41',
      },
      body: JSON.stringify({
        authorName: 'Child',
        authorEmail: 'child@example.com',
        body: 'Child node',
        parentId: parent.data.id,
      }),
    })
    const reply = await replyRes.json() as { data: { id: string } }

    const detailRes = await app.request(`/api/admin/comments/${reply.data.id}`, {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(detailRes.status).toBe(200)
    const detailPayload = await detailRes.json() as {
      data: {
        id: string
        parent: { id: string, body: string } | null
      }
    }
    expect(detailPayload.data.parent?.id).toBe(parent.data.id)

    const approveRes = await app.request(`/api/admin/comments/${parent.data.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'approved',
      }),
    })

    expect(approveRes.status).toBe(200)
    const approvePayload = await approveRes.json() as { data: { status: string, approvedAt: string | null } }
    expect(approvePayload.data.status).toBe('approved')
    expect(approvePayload.data.approvedAt).not.toBeNull()

    const deleteRes = await app.request(`/api/admin/comments/${parent.data.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(deleteRes.status).toBe(200)

    const missingChildRes = await app.request(`/api/admin/comments/${reply.data.id}`, {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(missingChildRes.status).toBe(404)
  })
})
