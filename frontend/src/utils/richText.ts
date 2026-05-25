import DOMPurify from 'dompurify'
import { sanitizeBlockAlignValue, sanitizeParagraphSizeValue } from './richTextFormatting'

const htmlLikePattern = /<\/?[a-z][\s\S]*>/i
const safeImagePlaceholderTag = 'safe-image-placeholder'
const supportedHtmlTags = new Set(['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'pre', 'code', 'img'])

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function isHtmlLike(input: string): boolean {
  const match = input.match(htmlLikePattern)
  if (!match) {
    return false
  }

  const tagName = match[0].match(/^<\s*\/?\s*([a-z0-9-]+)/i)?.[1]?.toLowerCase()
  return tagName != null && supportedHtmlTags.has(tagName)
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

export function renderRichContentHtml(input: string): string {
  if (isHtmlLike(input)) {
    return sanitizeRenderHtml(input)
  }

  const normalized = input.replace(/\r\n/g, '\n').trim()
  if (!normalized) {
    return sanitizeRenderHtml('<p></p>')
  }

  if (looksLikeMarkdown(normalized)) {
    return sanitizeRenderHtml(markdownToHtml(normalized))
  }

  return sanitizeRenderHtml(plainTextToHtml(normalized))
}

export function sanitizeRenderHtml(input: string): string {
  const safeImages = new Map<string, string>()
  const preparedInput = sanitizeBlockFormattingHtml(replaceSafeImagesWithPlaceholders(input, safeImages))
  const sanitized = DOMPurify.sanitize(preparedInput, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'pre', 'code', safeImagePlaceholderTag],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'safe-image-id', 'data-size', 'data-align'],
    ALLOW_DATA_ATTR: true,
    FORBID_ATTR: ['style', 'class', 'onerror', 'onclick'],
  })
  return restoreSafeImagesFromPlaceholders(sanitized, safeImages)
}

export function isMeaningfulEditorHtml(input: string): boolean {
  const text = decodeHtmlEntities(input.replace(/<[^>]+>/g, ''))
    .replace(/[\s\u00A0]+/g, '')

  if (text.length > 0) {
    return true
  }

  if (input.includes('<img')) {
    return hasMeaningfulSafeImage(input)
  }

  return false
}

function isSafeUploadedImageUrl(input: string): boolean {
  try {
    const filesBaseUrl = getFilesBaseUrl()
    const url = new URL(input)
    return url.origin === filesBaseUrl.origin && url.pathname.startsWith(filesBaseUrl.pathname)
  }
  catch {
    return false
  }
}

function hasMeaningfulSafeImage(input: string): boolean {
  const template = document.createElement('template')
  template.innerHTML = input

  for (const image of template.content.querySelectorAll('img')) {
    const src = image.getAttribute('src')
    if (src && isSafeUploadedImageUrl(src)) {
      return true
    }
  }

  return false
}

function sanitizeBlockFormattingHtml(input: string): string {
  const template = document.createElement('template')
  template.innerHTML = input

  for (const block of template.content.querySelectorAll('p, h1, h2, h3, h4, h5, h6')) {
    const safeAlign = sanitizeBlockAlignValue(block.getAttribute('data-align'))

    if (safeAlign) {
      block.setAttribute('data-align', safeAlign)
    } else {
      block.removeAttribute('data-align')
    }

    if (block.tagName.toLowerCase() === 'p') {
      const safeSize = sanitizeParagraphSizeValue(block.getAttribute('data-size'))
      if (safeSize) {
        block.setAttribute('data-size', safeSize)
      } else {
        block.removeAttribute('data-size')
      }
      continue
    }

    block.removeAttribute('data-size')
  }

  return template.innerHTML
}

function replaceSafeImagesWithPlaceholders(input: string, safeImages: Map<string, string>): string {
  const template = document.createElement('template')
  template.innerHTML = input

  for (const image of template.content.querySelectorAll('img')) {
    const src = image.getAttribute('src')
    if (!src || !isSafeUploadedImageUrl(src)) {
      image.remove()
      continue
    }

    const safeImageId = createSafeImageId(template.innerHTML, safeImages)
    const alt = image.getAttribute('alt') ?? ''
    const width = image.getAttribute('width')
    const height = image.getAttribute('height')
    const safeWidth = width && /^\d+$/.test(width) ? width : null
    const safeHeight = height && /^\d+$/.test(height) ? height : null
    safeImages.set(
      safeImageId,
      `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${safeWidth ? ` width="${safeWidth}"` : ''}${safeHeight ? ` height="${safeHeight}"` : ''}>`,
    )

    const placeholder = document.createElement(safeImagePlaceholderTag)
    placeholder.setAttribute('safe-image-id', safeImageId)
    image.replaceWith(placeholder)
  }

  return template.innerHTML
}

function restoreSafeImagesFromPlaceholders(input: string, safeImages: Map<string, string>): string {
  const template = document.createElement('template')
  template.innerHTML = input

  for (const placeholder of template.content.querySelectorAll(safeImagePlaceholderTag)) {
    const safeImageId = placeholder.getAttribute('safe-image-id')
    const imageHtml = safeImageId ? safeImages.get(safeImageId) : undefined

    if (!imageHtml) {
      placeholder.remove()
      continue
    }

    const imageTemplate = document.createElement('template')
    imageTemplate.innerHTML = imageHtml
    placeholder.replaceWith(imageTemplate.content)
  }

  return template.innerHTML
}

function createSafeImageId(input: string, safeImages: Map<string, string>): string {
  let safeImageId = ''

  do {
    safeImageId = crypto.randomUUID()
  }
  while (input.includes(safeImageId) || safeImages.has(safeImageId))

  return safeImageId
}

function getFilesBaseUrl(): URL {
  const configuredFilesBaseUrl = import.meta.env.VITE_FILES_BASE_URL
  if (configuredFilesBaseUrl) {
    return normalizeFilesBaseUrl(new URL(configuredFilesBaseUrl))
  }

  return normalizeFilesBaseUrl(new URL('/files/', import.meta.env.VITE_API_BASE_URL ?? 'https://api.example.com'))
}

function decodeHtmlEntities(input: string): string {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = input
  return textarea.value
}

function normalizeFilesBaseUrl(url: URL): URL {
  const normalizedUrl = new URL(url.toString())
  normalizedUrl.pathname = normalizedUrl.pathname.endsWith('/')
    ? normalizedUrl.pathname
    : `${normalizedUrl.pathname}/`
  return normalizedUrl
}

function looksLikeMarkdown(input: string): boolean {
  return /(^|\n)(#{1,6}\s|>\s|[-*]\s|\d+\.\s|```)|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`/.test(input)
}

function markdownToHtml(input: string): string {
  const lines = input.split('\n')
  const blocks: string[] = []
  let index = 0

  while (index < lines.length) {
    const rawLine = lines[index]
    const line = rawLine.trim()

    if (!line) {
      index += 1
      continue
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      index += 1

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }

      if (index < lines.length) {
        index += 1
      }

      blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      blocks.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`)
      index += 1
      continue
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = []

      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''))
        index += 1
      }

      blocks.push(`<blockquote><p>${quoteLines.map(renderInlineMarkdown).join('<br>')}</p></blockquote>`)
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []

      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(`<li>${renderInlineMarkdown(lines[index].trim().replace(/^[-*]\s+/, ''))}</li>`)
        index += 1
      }

      blocks.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(`<li>${renderInlineMarkdown(lines[index].trim().replace(/^\d+\.\s+/, ''))}</li>`)
        index += 1
      }

      blocks.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length && lines[index].trim()) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    blocks.push(`<p>${renderInlineMarkdown(paragraphLines.join(' '))}</p>`)
  }

  return blocks.join('')
}

function renderInlineMarkdown(input: string): string {
  const codeTokens: string[] = []
  let output = escapeHtml(input).replace(/`([^`]+)`/g, (_, code: string) => {
    const token = `__CODE_TOKEN_${codeTokens.length}__`
    codeTokens.push(`<code>${escapeHtml(code)}</code>`)
    return token
  })

  output = output
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label: string, url: string) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')

  for (const [index, tokenHtml] of codeTokens.entries()) {
    output = output.replace(`__CODE_TOKEN_${index}__`, tokenHtml)
  }

  return output
}
