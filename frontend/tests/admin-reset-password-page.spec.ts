import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import AdminResetPasswordPage from '../src/pages/auth/AdminResetPasswordPage.vue'
import en from '../src/i18n/locales/en'

const { hydrateAdminRecoverySession, updateAdminPassword } = vi.hoisted(() => ({
  hydrateAdminRecoverySession: vi.fn().mockResolvedValue(true),
  updateAdminPassword: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/services/adminAuth', () => ({
  hydrateAdminRecoverySession,
  updateAdminPassword,
}))

describe('AdminResetPasswordPage', () => {
  it('blocks submit when password confirmation does not match', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/admin/reset-password', component: AdminResetPasswordPage }],
    })

    await router.push('/admin/reset-password')
    await router.isReady()

    const wrapper = mount(AdminResetPasswordPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await flushPromises()
    await wrapper.get('input[name="password"]').setValue('secret123')
    await wrapper.get('input[name="confirmPassword"]').setValue('secret456')
    await wrapper.get('form').trigger('submit.prevent')

    expect(updateAdminPassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Passwords do not match')
  })

  it('updates password then redirects to /admin/login', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/admin/reset-password', component: AdminResetPasswordPage },
        { path: '/admin/login', component: { template: '<div>login</div>' } },
      ],
    })

    await router.push('/admin/reset-password')
    await router.isReady()

    const wrapper = mount(AdminResetPasswordPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await flushPromises()
    await wrapper.get('input[name="password"]').setValue('secret123')
    await wrapper.get('input[name="confirmPassword"]').setValue('secret123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(hydrateAdminRecoverySession).toHaveBeenCalled()
    expect(updateAdminPassword).toHaveBeenCalledWith('secret123')
    expect(router.currentRoute.value.fullPath).toBe('/admin/login')
  })
})
