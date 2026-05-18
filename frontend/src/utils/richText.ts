import DOMPurify from 'dompurify'

const htmlLikePattern = /<\/?[a-z][\s\S]*>/i

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function isHtmlLike(input: string): boolean {
  return htmlLikePattern.test(input)
}

export function plainTextToHtml(input: string): string {
  const normalized = input.replace(/\r\n/g, '\n').trim()
  if (!normalized) {
    return '<p></p>'
  }

  return normalized
    .split(/\n{2,}/)
    .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function sanitizeRenderHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'pre', 'code'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style', 'class', 'onerror', 'onclick'],
  })
}

export function isMeaningfulEditorHtml(input: string): boolean {
  const text = input
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')

  if (text.length > 0) {
    return true
  }

  return !/^(\s|<p><br><\/p>|<p><\/p>)*$/i.test(input.trim())
}
