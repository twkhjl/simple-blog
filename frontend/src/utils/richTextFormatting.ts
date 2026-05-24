export const BLOCK_ALIGN_VALUES = ['left', 'center', 'right'] as const
export const PARAGRAPH_SIZE_VALUES = ['small', 'large'] as const
export const HEADING_LEVEL_VALUES = [1, 2, 3, 4, 5, 6] as const

export type BlockAlignValue = (typeof BLOCK_ALIGN_VALUES)[number]
export type ParagraphSizeValue = (typeof PARAGRAPH_SIZE_VALUES)[number]
export type HeadingLevelValue = (typeof HEADING_LEVEL_VALUES)[number]
export type ParagraphStyleValue = 'paragraph' | ParagraphSizeValue | `heading-${HeadingLevelValue}`

export function sanitizeBlockAlignValue(input: string | null | undefined): BlockAlignValue | null {
  return BLOCK_ALIGN_VALUES.find(value => value === input) ?? null
}

export function sanitizeParagraphSizeValue(input: string | null | undefined): ParagraphSizeValue | null {
  return PARAGRAPH_SIZE_VALUES.find(value => value === input) ?? null
}

export function isHeadingStyleValue(input: string): input is `heading-${HeadingLevelValue}` {
  return /^heading-[1-6]$/.test(input)
}

export function parseHeadingLevelValue(input: string): HeadingLevelValue | null {
  if (!isHeadingStyleValue(input)) {
    return null
  }

  const level = Number(input.replace('heading-', ''))
  return HEADING_LEVEL_VALUES.find(value => value === level) ?? null
}
