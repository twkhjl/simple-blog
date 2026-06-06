import { describe, expect, it, vi } from 'vitest'
import { createPublicTagsService } from '../src/services/publicTags'

describe('publicTags service', () => {
  it('loads active tag list', async () => {
    const get = vi.fn().mockResolvedValue({
      items: [{ id: 'tag-1', name: 'Vue', slug: 'vue', postCount: 2 }],
      total: 1,
    })

    const service = createPublicTagsService({ get })
    const tags = await service.listTags()

    expect(get).toHaveBeenCalledWith('/api/tags')
    expect(tags[0]?.slug).toBe('vue')
  })

  it('loads posts by tag slug', async () => {
    const get = vi.fn().mockResolvedValue({
      tag: { id: 'tag-1', name: 'Vue', slug: 'vue' },
      items: [],
      total: 0,
    })

    const service = createPublicTagsService({ get })
    const payload = await service.getTagPosts('vue')

    expect(get).toHaveBeenCalledWith('/api/tags/vue')
    expect(payload.tag.name).toBe('Vue')
  })
})
