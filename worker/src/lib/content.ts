import sanitizeHtml from 'sanitize-html'

const allowedTags = ['p', 'br', 'strong', 'em', 'h1', 'h2', 'ul', 'ol', 'li', 'blockquote', 'a']
const allowedAttributes = {
  a: ['href', 'target', 'rel'],
} satisfies sanitizeHtml.IOptions['allowedAttributes']
const allowedSchemes = ['http', 'https', 'mailto']

function hasAllowedScheme(href: string): boolean {
  return allowedSchemes.some(scheme => href.toLowerCase().startsWith(`${scheme}:`))
}

export function normalizeRichTextHtml(input: string): string {
  return input
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
    .trim()
}

export function sanitizeRichTextHtml(input: string): string {
  const sanitized = sanitizeHtml(input, {
    allowedTags,
    allowedAttributes,
    allowedSchemes,
    transformTags: {
      a: (tagName: string, attribs: Record<string, string>) => {
        const next = { ...attribs }
        const href = next.href?.trim()

        if (!href || !hasAllowedScheme(href)) {
          delete next.href
          delete next.target
          delete next.rel
          return { tagName, attribs: next }
        }

        next.rel = 'noopener noreferrer'
        return { tagName, attribs: next }
      },
    },
  })

  return normalizeRichTextHtml(sanitized)
}

export function isMeaningfulRichText(input: string): boolean {
  const plainText = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/\s+/g, '')

  if (plainText.length > 0) {
    return true
  }

  return normalizeRichTextHtml(input).length > 0
}
