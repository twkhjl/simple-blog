import { describe, expect, it } from 'vitest'
import { isMeaningfulRichText, normalizeRichTextHtml, sanitizeRichTextHtml } from '../src/lib/content'

describe('rich text content helpers', () => {
  it('keeps only allowlist tags and safe links', () => {
    const input = '<h3>Title</h3><pre><code>const x = 1;</code></pre><p>Hello</p><script>alert(1)</script><a href="javascript:alert(1)" onclick="hack()">bad</a><a href="https://example.com">ok</a>'

    expect(sanitizeRichTextHtml(input)).toBe('<h3>Title</h3><pre><code>const x = 1;</code></pre><p>Hello</p><a>bad</a><a href="https://example.com" rel="noopener noreferrer">ok</a>')
  })

  it('keeps safe inline images and removes unsafe image sources', () => {
    const input = '<p>Hello</p><img src="https://cdn.example.com/files/posts/2026/05/editor.webp" alt="editor.webp"><img src="data:image/png;base64,aaa" alt="bad"><img alt="missing">'

    expect(sanitizeRichTextHtml(input)).toBe('<p>Hello</p><img src="https://cdn.example.com/files/posts/2026/05/editor.webp" alt="editor.webp" />')
  })

  it('keeps numeric image width and height attributes', () => {
    const input = '<p><img src="https://cdn.example.com/files/posts/2026/05/editor.webp" alt="editor.webp" width="320" height="180"></p>'

    expect(sanitizeRichTextHtml(input)).toBe('<p><img src="https://cdn.example.com/files/posts/2026/05/editor.webp" alt="editor.webp" width="320" height="180" /></p>')
  })

  it('keeps safe paragraph size and block alignment attributes', () => {
    const input = '<p data-size="small" data-align="center">Hello</p><h6 data-align="right">Title</h6>'

    expect(sanitizeRichTextHtml(input)).toBe('<p data-size="small" data-align="center">Hello</p><h6 data-align="right">Title</h6>')
  })

  it('removes invalid paragraph size and block alignment attributes', () => {
    const input = '<p data-size="giant" data-align="sideways">Hello</p><h6 data-align="down">Title</h6>'

    expect(sanitizeRichTextHtml(input)).toBe('<p>Hello</p><h6>Title</h6>')
  })

  it('normalizes empty blocks out of saved html', () => {
    expect(normalizeRichTextHtml('<p></p><p><br></p><p>Keep</p>')).toBe('<p>Keep</p>')
  })

  it('detects empty rich text as not meaningful', () => {
    expect(isMeaningfulRichText('<p></p>')).toBe(false)
    expect(isMeaningfulRichText('<p><br></p>')).toBe(false)
    expect(isMeaningfulRichText('<p>Real content</p>')).toBe(true)
    expect(isMeaningfulRichText('<img src="https://cdn.example.com/files/posts/2026/05/editor.webp" alt="editor.webp">')).toBe(true)
  })
})
