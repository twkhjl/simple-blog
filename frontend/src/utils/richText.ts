import DOMPurify from 'dompurify'

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

export function sanitizeRenderHtml(input: string): string {
  const safeImages = new Map<string, string>()
  const preparedInput = replaceSafeImagesWithPlaceholders(input, safeImages)
  const sanitized = DOMPurify.sanitize(preparedInput, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'pre', 'code', safeImagePlaceholderTag],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'safe-image-id'],
    ALLOW_DATA_ATTR: false,
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
    const safeWidth = width && /^\d+$/.test(width) ? width : null
    safeImages.set(
      safeImageId,
      `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${safeWidth ? ` width="${safeWidth}"` : ''}>`,
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
