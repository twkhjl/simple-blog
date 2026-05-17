import type { ApiEnvelope } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.example.com'

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`
}

export function createApiClient(
  fetchImpl: typeof fetch = fetch,
  getAccessToken: () => string | null = () => null,
) {
  async function request<T>(path: string, init: RequestInit = {}) {
    const accessToken = getAccessToken()
    const headers = new Headers(init.headers)

    headers.set('Content-Type', 'application/json')
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    const response = await fetchImpl(buildApiUrl(path), {
      ...init,
      headers,
    })

    const payload = await response.json() as ApiEnvelope<T> & {
      error?: {
        code: string
        message: string
      }
    }

    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message ?? 'API request failed')
    }

    return payload.data
  }

  return {
    get<T>(path: string) {
      return request<T>(path, { method: 'GET' })
    },
    post<T>(path: string, body: unknown) {
      return request<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    put<T>(path: string, body: unknown) {
      return request<T>(path, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
    },
    patch<T>(path: string, body: unknown) {
      return request<T>(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
    },
    delete<T>(path: string) {
      return request<T>(path, { method: 'DELETE' })
    },
  }
}

