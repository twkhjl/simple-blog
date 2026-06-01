import { describe, expect, it, vi } from 'vitest'
import { ApiRequestError } from '../src/services/api'
import { createPublicPostsService } from '../src/services/publicPosts'

describe('publicPosts service', () => {
  it('loads published post list from /api/posts envelope', async () => {
    const get = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'post-1',
          title: 'DB Post',
          slug: 'db-post',
          excerpt: 'Loaded from worker',
          coverImageUrl: 'https://cdn.example.com/post.webp',
          publishedAt: '2026-06-01T08:00:00Z',
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
    })

    const service = createPublicPostsService({ get })
    const posts = await service.listPosts()

    expect(get).toHaveBeenCalledWith('/api/posts')
    expect(posts).toEqual([
      {
        id: 'post-1',
        title: 'DB Post',
        slug: 'db-post',
        excerpt: 'Loaded from worker',
        coverImageUrl: 'https://cdn.example.com/post.webp',
        publishedAt: '2026-06-01T08:00:00Z',
      },
    ])
  })

  it('returns null for detail when API responds 404', async () => {
    const get = vi.fn().mockRejectedValue(
      new ApiRequestError('Post not found', { status: 404, code: 'NOT_FOUND' }),
    )

    const service = createPublicPostsService({ get })
    const post = await service.getPostBySlug('missing-post')

    expect(get).toHaveBeenCalledWith('/api/posts/missing-post')
    expect(post).toBeNull()
  })
})
