import type { PostRecord } from '../types'

const mockPosts: PostRecord[] = [
  {
    id: 'post-1',
    title: '第一篇文章',
    slug: 'first-post',
    excerpt: '第一篇文章摘要',
    content: '# 第一篇文章\n\n這是示意內容。',
    coverImageKey: 'posts/2026/05/cover.webp',
    status: 'published',
    authorId: 'editor-1',
    authorDisplayName: 'Editor User',
    publishedAt: '2026-05-16T00:00:00Z',
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-16T00:00:00Z',
  },
  {
    id: 'post-2',
    title: '草稿文章',
    slug: 'draft-post',
    excerpt: '草稿摘要',
    content: '# 草稿文章\n\n尚未發布。',
    coverImageKey: null,
    status: 'draft',
    authorId: 'editor-1',
    authorDisplayName: 'Editor User',
    publishedAt: null,
    createdAt: '2026-05-14T00:00:00Z',
    updatedAt: '2026-05-17T00:00:00Z',
  },
]

export function listPublishedPosts() {
  return mockPosts
    .filter(post => post.status === 'published')
    .map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImageUrl: post.coverImageKey ? `https://api.yourdomain.com/files/${post.coverImageKey}` : null,
      publishedAt: post.publishedAt,
    }))
}

export function getPublishedPostBySlug(slug: string) {
  const post = mockPosts.find(item => item.slug === slug && item.status === 'published')
  if (!post) {
    return null
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageKey ? `https://api.yourdomain.com/files/${post.coverImageKey}` : null,
    status: post.status,
    author: {
      id: post.authorId,
      displayName: post.authorDisplayName,
    },
    publishedAt: post.publishedAt,
  }
}

export function listAdminPosts(authorId?: string) {
  const items = authorId ? mockPosts.filter(post => post.authorId === authorId) : mockPosts

  return items.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    authorId: post.authorId,
    authorDisplayName: post.authorDisplayName,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  }))
}

export function getAdminPostById(id: string) {
  return mockPosts.find(post => post.id === id) ?? null
}

