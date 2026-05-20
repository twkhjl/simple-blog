export const LOCALE_STORAGE_KEY = 'simple-blog.locale'

export type AppLocale = 'zh-TW' | 'en'

const SUPPORTED_LOCALES: AppLocale[] = ['zh-TW', 'en']

export function normalizeLocale(locale: string | null | undefined): AppLocale {
  const value = locale?.trim()

  if (!value) {
    return 'zh-TW'
  }

  if (value === 'zh' || value === 'zh-TW' || value === 'zh-HK' || value === 'zh-Hant') {
    return 'zh-TW'
  }

  if (SUPPORTED_LOCALES.includes(value as AppLocale)) {
    return value as AppLocale
  }

  return 'en'
}

export function getSavedLocale(): AppLocale | null {
  const saved = globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY)
  return saved ? normalizeLocale(saved) : null
}

export function detectInitialLocale(): AppLocale {
  return getSavedLocale() ?? normalizeLocale(globalThis.navigator?.language)
}

export function persistLocale(locale: AppLocale) {
  globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, locale)
}
