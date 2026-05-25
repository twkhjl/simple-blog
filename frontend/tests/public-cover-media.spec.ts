import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PublicCoverMedia from '../src/components/public/PublicCoverMedia.vue'

describe('PublicCoverMedia', () => {
  it('falls back to placeholder when cover image fails to load', async () => {
    const wrapper = mount(PublicCoverMedia, {
      props: {
        src: 'https://cdn.example.com/missing.webp',
        alt: 'Missing cover',
        fallbackLabel: 'Missing cover',
        variant: 'featured',
      },
    })

    expect(wrapper.find('img').exists()).toBe(true)

    await wrapper.find('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-testid="public-cover-fallback"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Missing cover')
  })
})
