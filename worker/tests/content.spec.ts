import { describe, expect, it } from 'vitest'
import { isMeaningfulRichText, normalizeRichTextHtml, sanitizeRichTextHtml } from '../src/lib/content'

describe('rich text content helpers', () => {
  it('keeps only allowlist tags and safe links', () => {
    const input = '<h3>Title</h3><pre><code>const x = 1;</code></pre><p>Hello</p><script>alert(1)</script><a href="javascript:alert(1)" onclick="hack()">bad</a><a href="https://example.com">ok</a>'

    expect(sanitizeRichTextHtml(input)).toBe('<h3>Title</h3><pre><code>const x = 1;</code></pre><p>Hello</p><a>bad</a><a href="https://example.com" rel="noopener noreferrer">ok</a>')
  })

  it('normalizes empty blocks out of saved html', () => {
    expect(normalizeRichTextHtml('<p></p><p><br></p><p>Keep</p>')).toBe('<p>Keep</p>')
  })

  it('detects empty rich text as not meaningful', () => {
    expect(isMeaningfulRichText('<p></p>')).toBe(false)
    expect(isMeaningfulRichText('<p><br></p>')).toBe(false)
    expect(isMeaningfulRichText('<p>Real content</p>')).toBe(true)
  })
})
