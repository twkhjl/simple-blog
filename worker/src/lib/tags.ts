import type { TagRecord } from '../types'

export function normalizeTagName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function slugifyTagName(value: string) {
  return normalizeTagName(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function uniqTagInputs(values: string[]) {
  const seen = new Set<string>()
  const next: string[] = []

  for (const value of values) {
    const normalized = normalizeTagName(value)
    const slug = slugifyTagName(normalized)
    if (!normalized || !slug || seen.has(slug)) {
      continue
    }

    seen.add(slug)
    next.push(normalized)
  }

  return next
}

export function publicTagShape(tag: TagRecord) {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  }
}
