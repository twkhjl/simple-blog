import DOMPurify from 'dompurify'

const htmlLikePattern = /<\/?[a-z][\s\S]*>/i
const imageTagPattern = /<img\b[^>]*\bsrc\s*=\s*(['"])([^'"]+)\1[^>]*>/i
const filesBaseUrl = new URL('/files/', import.meta.env.VITE_API_BASE_URL ?? 'https://api.example.com')

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
  const safeImages = new Map<string, string>()
  const preparedInput = replaceSafeImagesWithTokens(input, safeImages)
  const sanitized = DOMPurify.sanitize(preparedInput, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'pre', 'code'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style', 'class', 'onerror', 'onclick'],
  })
  return restoreSafeImagesFromTokens(sanitized, safeImages)
}

export function isMeaningfulEditorHtml(input: string): boolean {
  const text = input
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')

  if (text.length > 0) {
    return true
  }

  if (imageTagPattern.test(input)) {
    return true
  }

  return !/^(\s|<p><br><\/p>|<p><\/p>)*$/i.test(input.trim())
}

function isSafeUploadedImageUrl(input: string): boolean {
  try {
    const url = new URL(input)
    return url.origin === filesBaseUrl.origin && url.pathname.startsWith(filesBaseUrl.pathname)
  }
  catch {
    return false
  }
}

function replaceSafeImagesWithTokens(input: string, safeImages: Map<string, string>): string {
  const template = document.createElement('template')
  template.innerHTML = input

  let index = 0
  for (const image of template.content.querySelectorAll('img')) {
    const src = image.getAttribute('src')
    if (!src || !isSafeUploadedImageUrl(src)) {
      image.remove()
      continue
    }

    const token = `__SAFE_IMAGE_${index}__`
    const alt = image.getAttribute('alt') ?? ''
    safeImages.set(token, `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`)
    image.replaceWith(token)
    index += 1
  }

  return template.innerHTML
}

function restoreSafeImagesFromTokens(input: string, safeImages: Map<string, string>): string {
  let output = input

  for (const [token, html] of safeImages) {
    output = output.replaceAll(token, html)
  }

  return output
}
