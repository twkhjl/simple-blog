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
        status: 'draft',
        publishedAt: null,
      }),
    })

    expect(res.status).toBe(201)
    const payload = await res.json() as { data: { slug: string, title: string } }
    expect(payload.data.slug).toBe('created-from-test')
    expect(payload.data.title).toBe('Created from test')
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
})
