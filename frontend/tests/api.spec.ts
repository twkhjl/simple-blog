import { describe, expect, it } from 'vitest'
import { buildApiUrl } from '../src/services/api'

describe('buildApiUrl', () => {
  it('joins base url with endpoint path', () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://api.example.com'
    expect(buildApiUrl('/api/posts')).toBe(`${baseUrl}/api/posts`)
  })
})
