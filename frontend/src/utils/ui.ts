import type { AdminPostListItem } from '../types'

export function formatDisplayDate(value: string | null) {
  if (!value) {
    return 'Unscheduled'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function getInitials(value: string) {
  const tokens = value.trim().split(/\s+/).filter(Boolean)

  if (!tokens.length) {
    return 'SB'
  }

  return tokens
    .slice(0, 2)
    .map(token => token[0]?.toUpperCase() ?? '')
    .join('')
}

export function buildAdminPostStats(posts: AdminPostListItem[]) {
  return posts.reduce(
    (acc, post) => {
      acc.total += 1
      acc[post.status] += 1
      return acc
    },
    {
      total: 0,
      draft: 0,
      published: 0,
      archived: 0,
    },
  )
}
