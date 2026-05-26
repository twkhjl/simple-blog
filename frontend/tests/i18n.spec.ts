import { afterEach, describe, expect, it, vi } from 'vitest'

describe('i18n locale helpers', () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'zh-Hant'
    document.title = ''
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('defaults to zh-TW when browser locale is unavailable and stores html lang mapping', async () => {
    vi.stubGlobal('navigator', { language: undefined })

    const { createAppI18n, syncDocumentLanguage } = await import('../src/i18n')
    const i18n = createAppI18n()

    expect(i18n.global.locale.value).toBe('zh-TW')

    syncDocumentLanguage(i18n.global.locale.value)
    expect(document.documentElement.lang).toBe('zh-Hant')
  })

  it('maps non-Chinese browser locales to en', async () => {
    vi.stubGlobal('navigator', { language: 'ja-JP' })

    const { createAppI18n } = await import('../src/i18n')
    const i18n = createAppI18n()

    expect(i18n.global.locale.value).toBe('en')
  })

  it('prefers saved locale over browser language', async () => {
    localStorage.setItem('simple-blog.locale', 'en')
    vi.stubGlobal('navigator', { language: 'zh-TW' })

    const { createAppI18n } = await import('../src/i18n')
    const i18n = createAppI18n()

    expect(i18n.global.locale.value).toBe('en')
  })

  it('updates document title from route title keys', async () => {
    const { createAppI18n, applyDocumentTitle } = await import('../src/i18n')
    const { createAppRouter } = await import('../src/router')

    const i18n = createAppI18n()
    const router = createAppRouter(i18n)
    await router.push('/login')

    applyDocumentTitle(router.currentRoute.value, i18n.global.t)
    expect(document.title).toBe('Login | Simple Blog')
  }, 10000)

  it('renders literal at-signs in localized email placeholders', async () => {
    const { createAppI18n } = await import('../src/i18n')
    const i18n = createAppI18n()

    expect(i18n.global.t('auth.login.emailPlaceholder')).toBe('editor@demo.invalid')

    i18n.global.locale.value = 'zh-TW'
    expect(i18n.global.t('auth.login.emailPlaceholder')).toBe('editor@demo.invalid')
  })

  it('renders literal at-signs in footer contact copy', async () => {
    const { createAppI18n } = await import('../src/i18n')
    const i18n = createAppI18n()

    expect(i18n.global.t('public.brand.footerCopy')).toBe('2026 twkhjl@gmail.com')

    i18n.global.locale.value = 'zh-TW'
    expect(i18n.global.t('public.brand.footerCopy')).toBe('2026 twkhjl@gmail.com')
  })
})
