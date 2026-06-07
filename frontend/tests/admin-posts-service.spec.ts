import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authState } from '../src/stores/auth'
import { createAdminPostsService } from '../src/services/adminPosts'

vi.mock('../src/services/auth', () => ({
  extractAccessToken: () => 'token',
}))

describe('adminPosts service', () => {
  beforeEach(() => {
    authState.session = { accessToken: 'token', refreshToken: 'refresh' } as never
  })

  it('loads paginated admin posts with stats', async () => {
    const get = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'post-1',
          title: 'DB Post',
          slug: 'db-post',
          status: 'published',
          authorId: 'editor-1',
          authorDisplayName: 'Editor User',
          publishedAt: '2026-06-01T08:00:00Z',
          updatedAt: '2026-06-02T09:00:00Z',
          tags: [{ id: 'tag-1', name: 'Vue', slug: 'vue' }],
        },
      ],
      page: 2,
      limit: 20,
      total: 21,
      stats: {
        total: 21,
        draft: 5,
        published: 14,
        archived: 2,
      },
    })

    const service = createAdminPostsService({ get })
    const payload = await service.listPosts({ page: 2, limit: 20 })

    expect(get).toHaveBeenCalledWith('/api/admin/posts?page=2&limit=20')
    expect(payload.stats.published).toBe(14)
    expect(payload.items).toHaveLength(1)
  })
})
