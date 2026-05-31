import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import AdminForgotPasswordPage from '../src/pages/auth/AdminForgotPasswordPage.vue'
import en from '../src/i18n/locales/en'

const { requestAdminPasswordReset } = vi.hoisted(() => ({
  requestAdminPasswordReset: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/services/adminAuth', () => ({
  requestAdminPasswordReset,
}))

describe('AdminForgotPasswordPage', () => {
  it('renders email field and submits reset request', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/admin/forgot-password', component: AdminForgotPasswordPage }],
    })

    await router.push('/admin/forgot-password')
    await router.isReady()

    const wrapper = mount(AdminForgotPasswordPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await wrapper.get('input[name="email"]').setValue('admin@demo.invalid')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(requestAdminPasswordReset).toHaveBeenCalledWith('admin@demo.invalid')
    expect(wrapper.text()).toContain('Check your inbox')
  })
})
