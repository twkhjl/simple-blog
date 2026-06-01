import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from '../src/pages/auth/LoginPage.vue'
import en from '../src/i18n/locales/en'

const { loginWithEmail } = vi.hoisted(() => ({
  loginWithEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/services/publicAuth', () => ({
  loginWithEmail,
}))

describe('LoginPage', () => {
  it('submits email and password then redirects to /login-records', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/login', component: LoginPage },
        { path: '/login-records', component: { template: '<div>records</div>' } },
      ],
    })

    await router.push('/login')
    await router.isReady()

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await wrapper.get('input[name="email"]').setValue('user@demo.invalid')
    await wrapper.get('input[name="password"]').setValue('secret123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(loginWithEmail).toHaveBeenCalledWith('user@demo.invalid', 'secret123')
    expect(router.currentRoute.value.fullPath).toBe('/login-records')
  })
})
