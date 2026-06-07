import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

function createWrapper() {
  return mount(AdminContactMessagesPage, {
    attachTo: document.body,
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
    },
  })
}

describe('AdminContactMessagesPage', () => {
  beforeEach(() => {
    listMessages.mockReset()
    getMessage.mockReset()
    updateStatus.mockReset()
  })

  it('renders messages in table mode', async () => {
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

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Subject')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Email')
    expect(wrapper.text()).toContain('Status')
    expect(wrapper.text()).toContain('Need help')
  })

  it('loads contact message detail in modal', async () => {
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

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-testid="admin-contact-view"]').trigger('click')
    await flushPromises()

    expect(getMessage).toHaveBeenCalledWith('contact-1')
    expect(wrapper.get('[data-testid="admin-modal"]').text()).toContain('Full content')
    expect(wrapper.get('[data-testid="admin-modal"]').text()).toContain('198.51.100.1')
  })

  it('updates contact message status from modal and syncs table', async () => {
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
      requestIp: null,
      userAgent: null,
    })
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

    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.get('[data-testid="admin-contact-view"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="admin-contact-modal-status"]').trigger('click')
    await flushPromises()

    expect(updateStatus).toHaveBeenCalledWith('contact-1', 'processed')
    expect(wrapper.text()).toContain('Processed')
  })
})
