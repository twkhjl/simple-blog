// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PublicDrawer from '../PublicDrawer.vue'

describe('PublicDrawer', () => {
  it('renders nav links and auth action without stretch layout classes', () => {
    const wrapper = mount(PublicDrawer, {
      props: {
        brand: 'TechHumana',
        signInLabel: '登入',
        loginRecordsLabel: '登入紀錄',
        logoutLabel: '登出',
        isLoggedIn: false,
        open: true,
        nav: [
          { label: '文章列表', to: '/' },
          { label: '關於我們', to: '/about' },
        ],
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    const nav = wrapper.get('nav.front-drawer-links')

    expect(nav.classes()).not.toContain('flex-grow')
    expect(nav.findAll('a')).toHaveLength(2)
    expect(wrapper.text()).toContain('登入')
  })
})
