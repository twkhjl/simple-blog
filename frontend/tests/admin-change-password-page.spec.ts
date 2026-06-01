import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError } from '../src/services/api'
import AdminChangePasswordPage from '../src/pages/admin/AdminChangePasswordPage.vue'
import en from '../src/i18n/locales/en'

const { changeAdminPassword } = vi.hoisted(() => ({
  changeAdminPassword: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('../src/services/adminAuth', () => ({
  changeAdminPassword,
}))

describe('AdminChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountPage() {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/admin/change-password', component: AdminChangePasswordPage }],
    })

    await router.push('/admin/change-password')
    await router.isReady()

    const wrapper = mount(AdminChangePasswordPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    return { router, wrapper }
  }

  it('blocks submit when confirmation does not match', async () => {
    const { wrapper } = await mountPage()

    await wrapper.get('input[name="currentPassword"]').setValue('secret123')
    await wrapper.get('input[name="newPassword"]').setValue('secret456')
    await wrapper.get('input[name="confirmPassword"]').setValue('secret789')
    await wrapper.get('form').trigger('submit.prevent')

    expect(changeAdminPassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Passwords do not match')
  })

  it('blocks submit when new password matches current password', async () => {
    const { wrapper } = await mountPage()

    await wrapper.get('input[name="currentPassword"]').setValue('secret123')
    await wrapper.get('input[name="newPassword"]').setValue('secret123')
    await wrapper.get('input[name="confirmPassword"]').setValue('secret123')
    await wrapper.get('form').trigger('submit.prevent')

    expect(changeAdminPassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('New password must be different from current password')
  })

  it('shows success state and clears fields after successful change', async () => {
    const { wrapper } = await mountPage()

    await wrapper.get('input[name="currentPassword"]').setValue('secret123')
    await wrapper.get('input[name="newPassword"]').setValue('secret456')
    await wrapper.get('input[name="confirmPassword"]').setValue('secret456')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(changeAdminPassword).toHaveBeenCalledWith({
      currentPassword: 'secret123',
      newPassword: 'secret456',
    })
    expect(wrapper.text()).toContain('Password updated successfully')
    expect((wrapper.get('input[name="currentPassword"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('input[name="newPassword"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('input[name="confirmPassword"]').element as HTMLInputElement).value).toBe('')
  })

  it('maps invalid current password api error', async () => {
    changeAdminPassword.mockRejectedValueOnce(new ApiRequestError('Current password is incorrect', {
      status: 400,
      code: 'INVALID_CURRENT_PASSWORD',
    }))

    const { wrapper } = await mountPage()

    await wrapper.get('input[name="currentPassword"]').setValue('wrong-secret')
    await wrapper.get('input[name="newPassword"]').setValue('secret456')
    await wrapper.get('input[name="confirmPassword"]').setValue('secret456')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Current password is incorrect')
  })
})
