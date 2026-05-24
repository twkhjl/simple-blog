import sanitizeHtml from 'sanitize-html'

const allowedTags = ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'pre', 'code', 'img']
const allowedAttributes = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  p: ['data-size', 'data-align'],
  h1: ['data-align'],
  h2: ['data-align'],
  h3: ['data-align'],
  h4: ['data-align'],
  h5: ['data-align'],
  h6: ['data-align'],
} satisfies sanitizeHtml.IOptions['allowedAttributes']
const allowedSchemes = ['http', 'https', 'mailto']
const allowedImageSchemes = ['http', 'https']
const allowedParagraphSizes = new Set(['small', 'large'])
const allowedBlockAlignments = new Set(['left', 'center', 'right'])

function hasAllowedScheme(href: string): boolean {
  return allowedSchemes.some(scheme => href.toLowerCase().startsWith(`${scheme}:`))
}

function hasAllowedImageSource(src: string): boolean {
  return allowedImageSchemes.some(scheme => src.toLowerCase().startsWith(`${scheme}:`))
}

function sanitizeBlockFormattingAttributes(
  attribs: Record<string, string>,
  options: { allowSize: boolean },
): Record<string, string> {
  const next = { ...attribs }
  const dataSize = next['data-size']?.trim()
  const dataAlign = next['data-align']?.trim()

  if (options.allowSize && dataSize && allowedParagraphSizes.has(dataSize)) {
    next['data-size'] = dataSize
  } else {
    delete next['data-size']
  }

  if (dataAlign && allowedBlockAlignments.has(dataAlign)) {
    next['data-align'] = dataAlign
  } else {
    delete next['data-align']
  }

  return next
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
        const width = next.width?.trim()
        const height = next.height?.trim()

        if (!src || !hasAllowedImageSource(src)) {
          delete next.src
        }

        if (!width || !/^\d+$/.test(width)) {
          delete next.width
        }

        if (!height || !/^\d+$/.test(height)) {
          delete next.height
        }

        return { tagName, attribs: next }
      },
      p: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: sanitizeBlockFormattingAttributes(attribs, { allowSize: true }),
      }),
      h1: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: sanitizeBlockFormattingAttributes(attribs, { allowSize: false }),
      }),
      h2: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: sanitizeBlockFormattingAttributes(attribs, { allowSize: false }),
      }),
      h3: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: sanitizeBlockFormattingAttributes(attribs, { allowSize: false }),
      }),
      h4: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: sanitizeBlockFormattingAttributes(attribs, { allowSize: false }),
      }),
      h5: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: sanitizeBlockFormattingAttributes(attribs, { allowSize: false }),
      }),
      h6: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: sanitizeBlockFormattingAttributes(attribs, { allowSize: false }),
      }),
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
