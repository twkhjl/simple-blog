import { describe, expect, it } from 'vitest'
import { extractAccessToken } from '../src/services/auth'

describe('extractAccessToken', () => {
  it('returns access token from session object', () => {
    expect(extractAccessToken({ access_token: 'abc' })).toBe('abc')
  })
})
