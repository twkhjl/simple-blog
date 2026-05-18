import { describe, expect, it } from 'vitest'
import { isHtmlLike, isMeaningfulEditorHtml, plainTextToHtml, sanitizeRenderHtml } from '../src/utils/richText'

describe('rich text helpers', () => {
  it('detects html-like content', () => {
    expect(isHtmlLike('<p>Hello</p>')).toBe(true)
    expect(isHtmlLike('Plain text only')).toBe(false)
  })

  it('converts plain text paragraphs into html blocks', () => {
    expect(plainTextToHtml('First line\n\nSecond line')).toBe('<p>First line</p><p>Second line</p>')
  })

  it('sanitizes render html', () => {
    expect(sanitizeRenderHtml('<p>Hello</p><script>alert(1)</script>')).toBe('<p>Hello</p>')
  })

  it('detects empty editor html', () => {
    expect(isMeaningfulEditorHtml('<p><br></p>')).toBe(false)
    expect(isMeaningfulEditorHtml('<p>Real text</p>')).toBe(true)
  })
})
