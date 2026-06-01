import type { ApiEnvelope } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.example.com'

export class ApiRequestError extends Error {
  status: number
  code: string | null

  constructor(message: string, options: { status: number, code?: string | null }) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = options.status
    this.code = options.code ?? null
  }
}

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
    const isFormDataBody = init.body instanceof FormData

    if (!isFormDataBody && init.body != null) {
      headers.set('Content-Type', 'application/json')
    }
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
      throw new ApiRequestError(
        payload.error?.message ?? 'API request failed',
        { status: response.status, code: payload.error?.code ?? null },
      )
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
    postForm<T>(path: string, body: FormData) {
      return request<T>(path, {
        method: 'POST',
        body,
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

