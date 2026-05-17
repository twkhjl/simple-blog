import { describe, expect, it } from 'vitest'
import { buildApiUrl } from '../src/services/api'

describe('buildApiUrl', () => {
  it('joins base url with endpoint path', () => {
    expect(buildApiUrl('/api/posts')).toBe('https://api.example.com/api/posts')
  })
})
