import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import AdminLoginPage from '../src/pages/auth/AdminLoginPage.vue'
import en from '../src/i18n/locales/en'

const { loginAdminWithUsername } = vi.hoisted(() => ({
  loginAdminWithUsername: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/services/adminAuth', () => ({
  loginAdminWithUsername,
}))

describe('AdminLoginPage', () => {
  it('renders username input for admin login', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/admin/login', component: AdminLoginPage }],
    })

    await router.push('/admin/login')
    await router.isReady()

    const wrapper = mount(AdminLoginPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    expect(wrapper.text()).toContain('Admin Login')
    expect(wrapper.find('input[name="username"]').exists()).toBe(true)
  })

  it('submits username and password then redirects to /admin', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/admin/login', component: AdminLoginPage },
        { path: '/admin', component: { template: '<div>admin</div>' } },
      ],
    })

    await router.push('/admin/login')
    await router.isReady()

    const wrapper = mount(AdminLoginPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await wrapper.get('input[name="username"]').setValue('admin')
    await wrapper.get('input[name="password"]').setValue('secret')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(loginAdminWithUsername).toHaveBeenCalledWith('admin', 'secret')
    expect(router.currentRoute.value.fullPath).toBe('/admin')
  })
})
