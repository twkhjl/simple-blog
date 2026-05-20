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
    expect(page).toContain('<RichTextEditor v-model="form.content" />')
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
})
