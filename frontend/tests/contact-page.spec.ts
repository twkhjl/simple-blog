import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactPage from '../src/pages/public/ContactPage.vue'
import zhTW from '../src/i18n/locales/zh-TW'

const { submitContact } = vi.hoisted(() => ({
  submitContact: vi.fn(),
}))

vi.mock('../src/services/publicContact', () => ({
  publicContactService: { submitContact },
}))

describe('ContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits contact form and resets fields on success', async () => {
    submitContact.mockResolvedValue({ success: true })

    const wrapper = mount(ContactPage, {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'zh-TW', messages: { 'zh-TW': zhTW } })],
      },
    })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('王小明')
    await inputs[1].setValue('reader@example.com')
    await inputs[2].setValue('合作洽詢')
    await wrapper.get('textarea').setValue('想了解合作方案')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(submitContact).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-testid="contact-submit-success"]').text()).toContain('留言已送出')
    expect((inputs[0].element as HTMLInputElement).value).toBe('')
  })

  it('shows validation errors without submitting', async () => {
    const wrapper = mount(ContactPage, {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'zh-TW', messages: { 'zh-TW': zhTW } })],
      },
    })

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(submitContact).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('請輸入姓名')
    expect(wrapper.text()).toContain('請輸入電子郵件')
  })
})
