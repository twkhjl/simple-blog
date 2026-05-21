import { describe, expect, it } from 'vitest'
import { isHtmlLike, isMeaningfulEditorHtml, plainTextToHtml, sanitizeRenderHtml } from '../src/utils/richText'

const filesBaseUrl = new URL('/files/', import.meta.env.VITE_API_BASE_URL ?? 'https://api.example.com')
const uploadedImageUrl = new URL('posts/2026/05/editor.webp', filesBaseUrl).toString()

describe('rich text helpers', () => {
  it('detects html-like content', () => {
    expect(isHtmlLike('<p>Hello</p>')).toBe(true)
    expect(isHtmlLike('Plain text only')).toBe(false)
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
})
