import { describe, expect, it, vi } from 'vitest'
import app from '../src/index'

describe('files upload api', () => {
  function createUploadFormData(fileName = 'cover.webp', type = 'image/webp') {
    const formData = new FormData()
    formData.set('folder', 'posts')
    formData.set('file', new File(['image-bytes'], fileName, { type }))
    return formData
  }

  it('returns 401 without token', async () => {
    const res = await app.request('/api/files/upload', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('uploads file to bucket for editor request', async () => {
    const put = vi.fn().mockResolvedValue(undefined)

    const res = await app.request('/api/files/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
      },
      body: createUploadFormData(),
    }, {
      FILES_BUCKET: { put } as unknown as R2Bucket,
      R2_PUBLIC_BASE_URL: 'https://cdn.example.com/files',
    })

    expect(res.status).toBe(200)
    expect(put).toHaveBeenCalledTimes(1)

    const [key, value, options] = put.mock.calls[0] as [string, File, { httpMetadata?: { contentType?: string } }]
    expect(key).toMatch(/^posts\/\d{4}\/\d{2}\/\d{13}-cover\.webp$/)
    expect(value.name).toBe('cover.webp')
    expect(options.httpMetadata?.contentType).toBe('image/webp')

    const payload = await res.json() as {
      data: {
        key: string
        url: string
        fileName: string
        mimeType: string
        size: number
      }
    }

    expect(payload.data.key).toBe(key)
    expect(payload.data.url).toBe(`https://cdn.example.com/files/${key}`)
    expect(payload.data.fileName).toBe('cover.webp')
    expect(payload.data.mimeType).toBe('image/webp')
    expect(payload.data.size).toBe(11)
  })

  it('returns 400 when folder is not posts', async () => {
    const formData = createUploadFormData()
    formData.set('folder', 'avatars')

    const res = await app.request('/api/files/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
      },
      body: formData,
    })

    expect(res.status).toBe(400)
  })

  it('returns 400 when file missing', async () => {
    const formData = new FormData()
    formData.set('folder', 'posts')

    const res = await app.request('/api/files/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
      },
      body: formData,
    })

    expect(res.status).toBe(400)
  })

  it('returns 500 when bucket binding missing', async () => {
    const res = await app.request('/api/files/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer editor-token',
      },
      body: createUploadFormData(),
    })

    expect(res.status).toBe(500)
  })

  it('serves uploaded file content from public files path', async () => {
    const get = vi.fn().mockResolvedValue({
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('image-bytes'))
          controller.close()
        },
      }),
      httpMetadata: {
        contentType: 'image/webp',
      },
      writeHttpMetadata(headers: Headers) {
        headers.set('content-type', 'image/webp')
      },
    })

    const res = await app.request('/files/posts/2026/05/example-cover.webp', undefined, {
      FILES_BUCKET: { get } as unknown as R2Bucket,
    })

    expect(res.status).toBe(200)
    expect(get).toHaveBeenCalledWith('posts/2026/05/example-cover.webp')
    expect(res.headers.get('content-type')).toContain('image/webp')
    await expect(res.text()).resolves.toBe('image-bytes')
  })
})
