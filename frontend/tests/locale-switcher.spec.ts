import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import LocaleSwitcher from '../src/components/app/LocaleSwitcher.vue'
import { createAppI18n } from '../src/i18n'

describe('LocaleSwitcher', () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'zh-Hant'
    document.title = ''
  })

  it('switches locale and persists selection', async () => {
    localStorage.setItem('simple-blog.locale', 'zh-TW')
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div>home</div>' }, meta: { titleKey: 'seo.home.title' } }],
    })
    await router.push('/')
    await router.isReady()

    const i18n = createAppI18n()
    const wrapper = mount(LocaleSwitcher, {
      global: {
        plugins: [i18n, router],
      },
    })

    await wrapper.get('[data-testid="locale-en"]').trigger('click')

    expect(i18n.global.locale.value).toBe('en')
    expect(localStorage.getItem('simple-blog.locale')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })
})
