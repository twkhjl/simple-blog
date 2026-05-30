import { Extension, type Editor } from '@tiptap/core'
import {
  type BlockAlignValue,
  type ParagraphStyleValue,
  parseHeadingLevelValue,
  sanitizeBlockAlignValue,
  sanitizeParagraphSizeValue,
} from '../../utils/richTextFormatting'

export const BlockFormattingExtension = Extension.create({
  name: 'blockFormatting',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          paragraphSize: {
            default: null,
            parseHTML: element => sanitizeParagraphSizeValue(element.getAttribute('data-size')),
            renderHTML: attributes => attributes.paragraphSize
              ? { 'data-size': attributes.paragraphSize }
              : {},
          },
          textAlign: {
            default: null,
            parseHTML: element => sanitizeBlockAlignValue(element.getAttribute('data-align')),
            renderHTML: attributes => attributes.textAlign
              ? { 'data-align': attributes.textAlign }
              : {},
          },
        },
      },
      {
        types: ['heading'],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: element => sanitizeBlockAlignValue(element.getAttribute('data-align')),
            renderHTML: attributes => attributes.textAlign
              ? { 'data-align': attributes.textAlign }
              : {},
          },
        },
      },
    ]
  },
})

export function getActiveParagraphStyle(editor: Editor | null): ParagraphStyleValue {
  if (!editor) {
    return 'paragraph'
  }

  for (const level of [1, 2, 3, 4, 5, 6] as const) {
    if (editor.isActive('heading', { level })) {
      return `heading-${level}`
    }
  }

  const paragraphSize = sanitizeParagraphSizeValue(editor.getAttributes('paragraph').paragraphSize)
  return paragraphSize ?? 'paragraph'
}

export function getActiveBlockAlign(editor: Editor | null): BlockAlignValue {
  if (!editor) {
    return 'left'
  }

  const activeNodeName = editor.isActive('heading') ? 'heading' : 'paragraph'
  const textAlign = sanitizeBlockAlignValue(editor.getAttributes(activeNodeName).textAlign)
  return textAlign ?? 'left'
}

export function applyParagraphStyle(editor: Editor | null, style: ParagraphStyleValue): boolean {
  if (!editor) {
    return false
  }

  const align = getActiveBlockAlign(editor)

  if (style === 'paragraph' || style === 'small' || style === 'large') {
    const chain = editor.chain().focus().setParagraph()
    chain.updateAttributes('paragraph', {
      paragraphSize: style === 'paragraph' ? null : style,
      textAlign: align === 'left' ? null : align,
    })
    return chain.run()
  }

  const level = parseHeadingLevelValue(style)
  if (!level) {
    return false
  }

  const chain = editor.chain().focus().setHeading({ level })
  chain.updateAttributes('heading', {
    textAlign: align === 'left' ? null : align,
  })
  return chain.run()
}

export function applyBlockAlign(editor: Editor | null, align: BlockAlignValue): boolean {
  if (!editor) {
    return false
  }

  const textAlign = align === 'left' ? null : align
  const nodeType = editor.isActive('heading') ? 'heading' : 'paragraph'

  return editor.chain().focus().updateAttributes(nodeType, {
    textAlign,
  }).run()
}
