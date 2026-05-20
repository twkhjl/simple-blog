import { describe, expect, it, vi } from 'vitest'
import { createImageUploader, isSupportedImageType } from '../src/services/uploads'

describe('image uploader', () => {
  it('exposes reusable image type guard for page-level validation', () => {
    expect(isSupportedImageType(new File(['abc'], 'cover.webp', { type: 'image/webp' }))).toBe(true)
    expect(isSupportedImageType(new File(['abc'], 'vector.svg', { type: 'image/svg+xml' }))).toBe(false)
  })

  it('uploads supported images to posts folder', async () => {
    const postForm = vi.fn().mockResolvedValue({
      key: 'posts/2026/05/example.webp',
      url: 'https://cdn.example.com/files/posts/2026/05/example.webp',
      fileName: 'example.webp',
      mimeType: 'image/webp',
      size: 123,
    })

    const uploader = createImageUploader({
      postForm,
      t: (key: string) => key,
    })

    const file = new File(['abc'], 'example.webp', { type: 'image/webp' })
    const uploaded = await uploader.upload(file)

    expect(postForm).toHaveBeenCalledTimes(1)
    const [path, formData] = postForm.mock.calls[0] as [string, FormData]
    expect(path).toBe('/api/files/upload')
    expect(formData.get('folder')).toBe('posts')
    expect(formData.get('file')).toBe(file)
    expect(uploaded.url).toContain('/posts/')
  })

  it('rejects unsupported file types before sending request', async () => {
    const postForm = vi.fn()
    const uploader = createImageUploader({
      postForm,
      t: (key: string) => key,
    })

    await expect(
      uploader.upload(new File(['abc'], 'vector.svg', { type: 'image/svg+xml' })),
    ).rejects.toThrow('common.messages.inlineImageMustBeImage')

    expect(postForm).not.toHaveBeenCalled()
  })

  it('rejects files larger than 5MB before sending request', async () => {
    const postForm = vi.fn()
    const uploader = createImageUploader({
      postForm,
      t: (key: string) => key,
    })

    await expect(
      uploader.upload(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' }),
      ),
    ).rejects.toThrow('common.messages.inlineImageTooLarge')

    expect(postForm).not.toHaveBeenCalled()
  })
})
