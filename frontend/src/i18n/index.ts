import { createI18n } from 'vue-i18n'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import en from './locales/en'
import zhTW from './locales/zh-TW'
import { detectInitialLocale, persistLocale, type AppLocale } from './useLocale'

export { LOCALE_STORAGE_KEY, detectInitialLocale, normalizeLocale, persistLocale, type AppLocale } from './useLocale'

export const messages = {
  'zh-TW': zhTW,
  en,
} as const

export function createAppI18n() {
  return createI18n({
    legacy: false,
    locale: detectInitialLocale(),
    fallbackLocale: 'zh-TW',
    messages,
  })
}

export function syncDocumentLanguage(locale: AppLocale) {
  document.documentElement.lang = locale === 'zh-TW' ? 'zh-Hant' : 'en'
}

export function applyDocumentTitle(route: RouteLocationNormalizedLoaded, t: (key: string) => string) {
  const titleKey = typeof route.meta.titleKey === 'string' ? route.meta.titleKey : 'seo.app.title'
  document.title = `${t(titleKey)} | Simple Blog`
}

export function setAppLocale(locale: AppLocale) {
  persistLocale(locale)
  syncDocumentLanguage(locale)
}

export function formatLocaleTitle(pageTitle: string) {
  return `${pageTitle} | Simple Blog`
}
