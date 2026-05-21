import sanitizeHtml from 'sanitize-html'

const allowedTags = ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'pre', 'code', 'img']
const allowedAttributes = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt'],
} satisfies sanitizeHtml.IOptions['allowedAttributes']
const allowedSchemes = ['http', 'https', 'mailto']
const allowedImageSchemes = ['http', 'https']

function hasAllowedScheme(href: string): boolean {
  return allowedSchemes.some(scheme => href.toLowerCase().startsWith(`${scheme}:`))
}

function hasAllowedImageSource(src: string): boolean {
  return allowedImageSchemes.some(scheme => src.toLowerCase().startsWith(`${scheme}:`))
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
      img: (tagName: string, attribs: Record<string, string>) => {
        const next = { ...attribs }
        const src = next.src?.trim()

        if (!src || !hasAllowedImageSource(src)) {
          delete next.src
        }

        return { tagName, attribs: next }
      },
    },
    exclusiveFilter(frame) {
      return frame.tag === 'img' && !frame.attribs.src
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
