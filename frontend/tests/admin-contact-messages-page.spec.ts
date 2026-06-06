import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import AdminContactMessagesPage from '../src/pages/admin/AdminContactMessagesPage.vue'
import en from '../src/i18n/locales/en'

const { listMessages, getMessage, updateStatus } = vi.hoisted(() => ({
  listMessages: vi.fn(),
  getMessage: vi.fn(),
  updateStatus: vi.fn(),
}))

vi.mock('../src/services/adminContactMessages', () => ({
  adminContactMessagesService: { listMessages, getMessage, updateStatus },
}))

describe('AdminContactMessagesPage', () => {
  it('loads contact messages and shows detail', async () => {
    listMessages.mockResolvedValue([
      {
        id: 'contact-1',
        name: 'Reader',
        email: 'reader@example.com',
        subject: 'Need help',
        status: 'pending',
        createdAt: '2026-06-06T00:00:00Z',
        processedAt: null,
      },
    ])
    getMessage.mockResolvedValue({
      id: 'contact-1',
      name: 'Reader',
      email: 'reader@example.com',
      subject: 'Need help',
      message: 'Full content',
      status: 'pending',
      createdAt: '2026-06-06T00:00:00Z',
      updatedAt: '2026-06-06T00:00:00Z',
      processedAt: null,
      requestIp: '198.51.100.1',
      userAgent: 'Mozilla/5.0',
    })

    const wrapper = mount(AdminContactMessagesPage, {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
      },
    })

    await flushPromises()
    expect(listMessages).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Need help')

    await wrapper.get('[data-testid="admin-contact-view"]').trigger('click')
    await flushPromises()

    expect(getMessage).toHaveBeenCalledWith('contact-1')
    expect(wrapper.get('[data-testid="admin-contact-detail"]').text()).toContain('Full content')
  })

  it('updates contact message status', async () => {
    listMessages.mockResolvedValue([
      {
        id: 'contact-1',
        name: 'Reader',
        email: 'reader@example.com',
        subject: 'Need help',
        status: 'pending',
        createdAt: '2026-06-06T00:00:00Z',
        processedAt: null,
      },
    ])
    updateStatus.mockResolvedValue({
      id: 'contact-1',
      name: 'Reader',
      email: 'reader@example.com',
      subject: 'Need help',
      message: 'Full content',
      status: 'processed',
      createdAt: '2026-06-06T00:00:00Z',
      updatedAt: '2026-06-06T00:10:00Z',
      processedAt: '2026-06-06T00:10:00Z',
      requestIp: null,
      userAgent: null,
    })

    const wrapper = mount(AdminContactMessagesPage, {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
      },
    })

    await flushPromises()
    await wrapper.get('[data-testid="admin-contact-status"]').trigger('click')
    await flushPromises()

    expect(updateStatus).toHaveBeenCalledWith('contact-1', 'processed')
    expect(wrapper.text()).toContain('Processed')
  })
})
