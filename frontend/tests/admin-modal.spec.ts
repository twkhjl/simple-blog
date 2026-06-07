import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AdminModal from '../src/components/admin/AdminModal.vue'

describe('AdminModal', () => {
  it('renders dialog shell when open', () => {
    const wrapper = mount(AdminModal, {
      props: {
        open: true,
        title: 'Dialog Title',
      },
      slots: {
        default: '<p>Body</p>',
      },
    })

    expect(wrapper.get('[data-testid="admin-modal"]').attributes('role')).toBe('dialog')
    expect(wrapper.get('[data-testid="admin-modal"]').attributes('aria-modal')).toBe('true')
    expect(wrapper.text()).toContain('Dialog Title')
    expect(wrapper.text()).toContain('Body')
  })

  it('emits close on backdrop and close button', async () => {
    const wrapper = mount(AdminModal, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Dialog Title',
      },
    })

    await wrapper.get('[data-testid="admin-modal-close"]').trigger('click')
    await wrapper.get('[data-testid="admin-modal-backdrop"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(2)
  })
})
