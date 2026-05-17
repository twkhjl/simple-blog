import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../src/services/api'

describe('createApiClient', () => {
  it('sends bearer token when provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { items: [] } }),
    })

    const client = createApiClient(fetchMock as typeof fetch, () => 'token-1')
    await client.get('/api/posts')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]
    const headers = init?.headers as Headers
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://api.example.com'

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${baseUrl}/api/posts`)
    expect(headers.get('Authorization')).toBe('Bearer token-1')
  })
})
