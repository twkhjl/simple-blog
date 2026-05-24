import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildAdminPostStats, formatDisplayDate, getInitials } from '../src/utils/ui'

describe('ui helpers', () => {
  it('formats nullable dates for display', () => {
    expect(formatDisplayDate(null)).toBe('Unscheduled')
    expect(formatDisplayDate('2026-05-18T12:30:00.000Z')).toMatch('2026')
  })

  it('builds admin stats from post list', () => {
    const stats = buildAdminPostStats([
      {
        id: '1',
        title: 'A',
        slug: 'a',
        status: 'draft',
        authorId: 'u1',
        authorDisplayName: null,
        publishedAt: null,
        updatedAt: '2026-05-18T00:00:00.000Z',
      },
      {
        id: '2',
        title: 'B',
        slug: 'b',
        status: 'published',
        authorId: 'u1',
        authorDisplayName: 'Kai',
        publishedAt: '2026-05-17T00:00:00.000Z',
        updatedAt: '2026-05-18T00:00:00.000Z',
      },
    ])

    expect(stats.total).toBe(2)
    expect(stats.draft).toBe(1)
    expect(stats.published).toBe(1)
    expect(stats.archived).toBe(0)
  })

  it('creates initials fallback for display names', () => {
    expect(getInitials('Simple Blog')).toBe('SB')
    expect(getInitials('')).toBe('SB')
  })

  it('does not force cover images into grayscale-like blend styling', () => {
    const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')
    const coverFrameRule = css.match(/\.cover-frame img\s*\{[^}]*\}/)?.[0] ?? ''

    expect(coverFrameRule).not.toContain('mix-blend-mode: luminosity')
    expect(coverFrameRule).not.toContain('opacity: 0.88')
  })

  it('does not wrap RichTextEditor inside a label element', () => {
    const page = readFileSync(resolve(__dirname, '../src/pages/admin/AdminPostEditPage.vue'), 'utf8')
    expect(page).toContain('<div class="field" style="margin-top: 1rem;">')
    expect(page).toContain("{{ t('common.labels.content') }}")
    expect(page).toContain('<RichTextEditor ref="richTextEditor" v-model="form.content" />')
    expect(page).not.toContain('<label class="field" style="margin-top: 1rem;">')
  })

  it('styles code blocks with distinct background in editor and public content', () => {
    const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

    const preRule = css.match(/\.rich-content pre,\s*[\r\n]+\s*\.tiptap pre\s*\{[^}]*\}/)?.[0] ?? ''

    expect(preRule).toContain('background:')
    expect(preRule).toContain('border:')
    expect(preRule).toContain('overflow-x: auto')
  })

  it('defines dedicated mobile public menu styles', () => {
    const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

    expect(css).toContain('.mobile-menu-toggle')
    expect(css).toContain('.mobile-menu-panel')
    expect(css).toContain('.mobile-menu-section')
    expect(css).toContain('.desktop-nav')
    expect(css).toContain('.desktop-actions')
  })

  it('adds locale switcher styling and localized login template bindings', () => {
    const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')
    const loginPage = readFileSync(resolve(__dirname, '../src/pages/auth/LoginPage.vue'), 'utf8')

    expect(css).toContain('.locale-switcher')
    expect(css).toContain('.locale-switcher-option')
    expect(loginPage).toContain("t('auth.login.title')")
    expect(loginPage).toContain("t('common.actions.login')")
  })

  it('does not render public cover fallback blocks when posts have no image', () => {
    const homePage = readFileSync(resolve(__dirname, '../src/pages/public/HomePage.vue'), 'utf8')
    const postDetailPage = readFileSync(resolve(__dirname, '../src/pages/public/PostDetailPage.vue'), 'utf8')

    expect(homePage).not.toContain('class="media-fallback"')
    expect(postDetailPage).not.toContain('class="media-fallback"')
    expect(homePage).toContain('v-if="post.coverImageUrl"')
    expect(postDetailPage).toContain('v-if="post.coverImageUrl"')
  })

  it('keeps public article action buttons from stretching to full card height', () => {
    const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

    expect(css).toContain('.post-card .inline-actions')
    expect(css).toContain('align-self: end')
    expect(css).toContain('.post-card .inline-actions .neo-button')
    expect(css).toContain('width: auto')
  })

  it('styles inline editor images for both authoring and public views', () => {
    const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')
    const imageRule = css.match(/\.rich-content img,\s*[\r\n]+\s*\.tiptap img\s*\{[^}]*\}/)?.[0] ?? ''

    expect(css).toContain('.rich-content img')
    expect(css).toContain('.tiptap img')
    expect(css).toContain('max-width: 100%')
    expect(imageRule).not.toContain('height: auto')
  })

  it('styles selectable resizable editor images', () => {
    const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

    expect(css).toContain('.resizable-image-node')
    expect(css).toContain('.resizable-image-node.is-selected')
    expect(css).toContain('.image-resize-handle')
    expect(css).toContain('.image-resize-handle.edge-top')
    expect(css).toContain('.image-resize-handle.corner-top-left')
    expect(css).toContain('.image-resize-handle.corner-bottom-right')
  })

  it('styles rich editor toolbar like a grouped icon editor', () => {
    const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')
    const editor = readFileSync(resolve(__dirname, '../src/components/editor/RichTextEditor.vue'), 'utf8')
    const toolbarRule = css.match(/\.rich-toolbar\s*\{[^}]*\}/)?.[0] ?? ''
    const toolbarGroupRule = css.match(/\.rich-toolbar-group\s*\{[^}]*\}/)?.[0] ?? ''
    const mobileToolbarRule = css.match(/\.rich-toolbar\s*\{\s*flex-wrap:\s*nowrap;[\s\S]*?justify-content:\s*flex-start;[\s\S]*?\}/)?.[0] ?? ''

    expect(css).toContain('.rich-toolbar-group')
    expect(css).toContain('.editor-tool')
    expect(css).toContain('.editor-tool.is-active')
    expect(css).toContain('.editor-tool svg')
    expect(toolbarRule).toContain('flex-wrap: wrap')
    expect(toolbarRule).not.toContain('overflow-x: auto')
    expect(toolbarGroupRule).toContain('flex-wrap: wrap')
    expect(mobileToolbarRule).toBe('')
    expect(editor).toContain('data-testid="paragraph-style-select"')
    expect(editor).toContain('data-testid="align-left"')
    expect(editor).toContain('data-testid="align-center"')
    expect(editor).toContain('data-testid="align-right"')
    expect(editor).toContain('data-testid="toggle-inline-code"')
    expect(editor).toContain('data-testid="toggle-code-block"')
    expect(editor).toContain('data-testid="insert-horizontal-rule"')
  })

  it('styles paragraph size and alignment output in editor and public content', () => {
    const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

    expect(css).toContain('.rich-content [data-size="small"]')
    expect(css).toContain('.rich-content [data-size="large"]')
    expect(css).toContain('.rich-content [data-align="center"]')
    expect(css).toContain('.tiptap [data-align="right"]')
  })
})
