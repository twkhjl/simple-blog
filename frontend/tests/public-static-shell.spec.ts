import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import PublicLayout from '../src/layouts/PublicLayout.vue'
import HomePage from '../src/pages/public/HomePage.vue'

describe('restored public shell integration', () => {
  it('mounts the restored home route inside PublicLayout', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          component: PublicLayout,
          children: [{ path: '', component: HomePage }],
        },
      ],
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(PublicLayout, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('TechHumana')
    expect(wrapper.html()).toContain('探索設計、技術與工作流')
  })
})
