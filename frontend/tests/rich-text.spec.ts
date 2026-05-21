import { afterEach, describe, expect, it, vi } from 'vitest'
import { isHtmlLike, isMeaningfulEditorHtml, plainTextToHtml, sanitizeRenderHtml } from '../src/utils/richText'

const apiFilesBaseUrl = new URL('/files/', import.meta.env.VITE_API_BASE_URL ?? 'https://api.example.com')
const uploadedImageUrl = new URL('posts/2026/05/editor.webp', apiFilesBaseUrl).toString()
const cdnFilesBaseUrl = 'https://cdn.example.com/files/'
const cdnImageUrl = new URL('posts/2026/05/editor.webp', cdnFilesBaseUrl).toString()

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('rich text helpers', () => {
  it('detects html-like content', () => {
    expect(isHtmlLike('<p>Hello</p>')).toBe(true)
    expect(isHtmlLike('Plain text only')).toBe(false)
    expect(isHtmlLike('Use <custom> tags')).toBe(false)
  })

  it('converts plain text paragraphs into html blocks', () => {
    expect(plainTextToHtml('First line\n\nSecond line')).toBe('<p>First line</p><p>Second line</p>')
  })

  it('sanitizes render html', () => {
    expect(sanitizeRenderHtml('<h3>Title</h3><pre><code>const x = 1;</code></pre><p>Hello</p><script>alert(1)</script>'))
      .toBe('<h3>Title</h3><pre><code>const x = 1;</code></pre><p>Hello</p>')
  })

  it('allows uploaded file images from configured API origin', () => {
    expect(
      sanitizeRenderHtml(`<p><img src="${uploadedImageUrl}" alt="editor.webp"></p>`),
    ).toContain('<img')
  })

  it('allows uploaded file images from configured files base url', async () => {
    vi.stubEnv('VITE_FILES_BASE_URL', cdnFilesBaseUrl)
    vi.resetModules()
    const { sanitizeRenderHtml } = await import('../src/utils/richText')

    expect(
      sanitizeRenderHtml(`<p><img src="${cdnImageUrl}" alt="editor.webp"></p>`),
    ).toContain('<img')
  })

  it('rejects files-malicious path when configured files base url has no trailing slash', async () => {
    vi.stubEnv('VITE_FILES_BASE_URL', 'https://cdn.example.com/files')
    vi.resetModules()
    const { sanitizeRenderHtml, isMeaningfulEditorHtml } = await import('../src/utils/richText')

    expect(
      sanitizeRenderHtml('<p><img src="https://cdn.example.com/files-malicious/posts/2026/05/editor.webp" alt="editor.webp"></p>'),
    ).not.toContain('<img')
    expect(
      isMeaningfulEditorHtml('<p><img src="https://cdn.example.com/files-malicious/posts/2026/05/editor.webp" alt="editor.webp"></p>'),
    ).toBe(false)
  })

  it('removes external image urls from rendered html', () => {
    expect(
      sanitizeRenderHtml('<p><img src="https://tracker.example.net/pixel.png" alt="pixel"></p>'),
    ).not.toContain('<img')
  })

  it('removes data url images from rendered html', () => {
    expect(
      sanitizeRenderHtml('<p><img src="data:image/png;base64,abc" alt="pixel"></p>'),
    ).not.toContain('<img')
  })

  it('removes blob url images from rendered html', () => {
    expect(
      sanitizeRenderHtml('<p><img src="blob:https://api.example.com/1234" alt="pixel"></p>'),
    ).not.toContain('<img')
  })

  it('detects empty editor html', () => {
    expect(isMeaningfulEditorHtml('<p><br></p>')).toBe(false)
    expect(isMeaningfulEditorHtml('<p>Real text</p>')).toBe(true)
  })

  it('treats image-only editor html as meaningful', () => {
    expect(
      isMeaningfulEditorHtml(`<p><img src="${uploadedImageUrl}" alt="editor.webp"></p>`),
    ).toBe(true)
  })

  it('treats configured files base url image html as meaningful', async () => {
    vi.stubEnv('VITE_FILES_BASE_URL', cdnFilesBaseUrl)
    vi.resetModules()
    const { isMeaningfulEditorHtml } = await import('../src/utils/richText')

    expect(
      isMeaningfulEditorHtml(`<p><img src="${cdnImageUrl}" alt="editor.webp"></p>`),
    ).toBe(true)
  })

  it('treats external-only image html as not meaningful', () => {
    expect(
      isMeaningfulEditorHtml('<p><img src="https://tracker.example.net/pixel.png" alt="pixel"></p>'),
    ).toBe(false)
  })

  it('treats data-url-only image html as not meaningful', () => {
    expect(
      isMeaningfulEditorHtml('<p><img src="data:image/png;base64,abc" alt="pixel"></p>'),
    ).toBe(false)
  })

  it('treats blob-url-only image html as not meaningful', () => {
    expect(
      isMeaningfulEditorHtml('<p><img src="blob:https://api.example.com/1234" alt="pixel"></p>'),
    ).toBe(false)
  })

  it('does not restore safe image html into body text when token-like text exists', () => {
    expect(
      sanitizeRenderHtml(`<p><img src="${uploadedImageUrl}" alt="editor.webp"></p><p>__SAFE_IMAGE_0__</p>`),
    ).toBe(`<p><img src="${uploadedImageUrl}" alt="editor.webp"></p><p>__SAFE_IMAGE_0__</p>`)
  })

  it('treats nbsp-only editor html as not meaningful', () => {
    expect(isMeaningfulEditorHtml('<p>&nbsp;</p>')).toBe(false)
    expect(isMeaningfulEditorHtml('<p>&#160;</p>')).toBe(false)
  })
})
