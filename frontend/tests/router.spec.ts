import { describe, expect, it } from 'vitest'
import { createAppRouter } from '../src/router'

describe('router', () => {
  it('uses hash history for GitHub Pages compatibility', () => {
    const router = createAppRouter()
    expect(router.options.history.base).toBe('/simple-blog/#')
  })

  it('registers public, auth and admin routes', () => {
    const paths = createAppRouter().getRoutes().map(route => route.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/post/:slug')
    expect(paths).toContain('/login')
    expect(paths).toContain('/register')
    expect(paths).toContain('/profile')
    expect(paths).toContain('/admin')
    expect(paths).toContain('/admin/posts')
    expect(paths).toContain('/admin/posts/new')
    expect(paths).toContain('/admin/posts/:id/edit')
  })
})
