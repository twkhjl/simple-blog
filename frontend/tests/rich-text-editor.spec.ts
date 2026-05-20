import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createAppI18n } from '../src/i18n'
import RichTextEditor from '../src/components/editor/RichTextEditor.vue'

describe('RichTextEditor', () => {
  it('emits updated html when content changes', async () => {
    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p>Start</p>',
      },
    })

    await wrapper.find('[data-testid="rich-editor-input"]').setValue('<p>Changed</p>')

    const events = wrapper.emitted('update:modelValue')
    expect(events?.[events.length - 1]?.[0]).toBe('<p>Changed</p>')
  })

  it('applies and removes links through inline form', async () => {
    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p>Hello</p>',
      },
    })

    await wrapper.get('[data-testid="toggle-link-form"]').trigger('click')
    await wrapper.get('[data-testid="link-url-input"]').setValue('https://example.com')
    await wrapper.get('[data-testid="apply-link"]').trigger('click')

    const emitted = wrapper.emitted('update:modelValue') ?? []
    expect(emitted[emitted.length - 1]?.[0]).toContain('href="https://example.com"')

    await wrapper.get('[data-testid="remove-link"]').trigger('click')
    const latest = wrapper.emitted('update:modelValue') ?? []
    expect(latest[latest.length - 1]?.[0]).not.toContain('href=')
  })
})
